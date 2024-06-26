import { Knex } from "knex";
import { UnixTime } from "@/core/types/UnixTime";
import {
  BlockValueRecord,
  chainTableMapping,
} from "@/database/repositories/BlockValueRepository";
import {
  BlockVarViewModel,
  SubmissionType,
  ValueType,
  VarByContractViewModel,
  VarByTypeViewModel,
} from "@/shared/api/viewModels/SyncStatusEndpoint";
import {
  getValue,
  mergeValues,
  ValueByContract,
  ValueByType,
  ValueMapping,
} from "@/core/controllers/appraiser/types";
import chains from "@/shared/chains.json";
import { whitelistedMap } from "@/core/clients/coingecko/assets/types";

export const TABLE_NAME = "sync_status";

export interface SyncStatusRecord {
  chain_id: number;
  l2_block_number: bigint;
  l2_block_hash: string | null;
  l1_block_number: number | null;
  l1_block_hash: string | null;
  timestamp: Date;
  submission_type: SubmissionType;
}

export interface SyncStatusExRecord extends SyncStatusRecord {
  l2_block_timestamp: Date;
}

export interface SubmissionInterval {
  timestamp: Date;
  timeDiff: UnixTime;
  blockDiff: number;
}

interface SubmissionIntervalRow {
  submission_type: SubmissionType;
  timestamp: Date;
  time_diff: UnixTime;
  block_diff: number;
}

export type GroupRange = "hour" | "day" | "week" | "month" | "quarter" | "year";

// Separates method signature from the underlying SQL query and prevents possible SQL injection attack
const rangeMapping: { [range in GroupRange]: string } = {
  ["hour"]: "hour",
  ["day"]: "day",
  ["week"]: "week",
  ["month"]: "month",
  ["quarter"]: "quarter",
  ["year"]: "year",
};

export class SyncStatusRepository {
  private readonly knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async insertSyncStatus(syncStatus: SyncStatusRecord): Promise<void> {
    await this.knex(TABLE_NAME)
      .insert(syncStatus)
      .onConflict(["chain_id", "l2_block_number", "submission_type"])
      .merge();
  }

  getLastSyncStatus(
    chainId: number,
    type?: SubmissionType,
    before?: Date,
  ): Promise<SyncStatusRecord | undefined> {
    type ??= this.getDefaultSubmissionType(chainId);

    let query = this.knex(TABLE_NAME)
      .where("chain_id", chainId)
      .where("submission_type", type);

    if (before) query = query.where("timestamp", "<=", before);

    return query
      .orderBy("timestamp", "desc")
      .select<SyncStatusRecord[]>("timestamp")
      .first();
  }

  async getPaginatedSyncStatus(
    chainId: number,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<SyncStatusExRecord[]> {
    const offset = (page - 1) * pageSize;
    return this.knex({ s: TABLE_NAME })
      .select(
        "s.l2_block_number",
        "s.l2_block_hash",
        "s.l1_block_number",
        "s.l1_block_hash",
        "s.timestamp",
        "s.submission_type",
        "l2.l2_block_timestamp",
      )
      .where("chain_id", chainId)
      .leftJoin(
        { l2: chainTableMapping[chainId] },
        "s.l2_block_number",
        "=",
        "l2.l2_block_number",
      )
      .orderBy("timestamp", "desc")
      .limit(pageSize)
      .offset(offset);
  }

  async getAverageSubmissionInterval(
    chainId: number,
    groupRange: GroupRange,
    from?: Date,
    to?: Date,
  ): Promise<Map<SubmissionType, SubmissionInterval[]>> {
    let subquery = this.knex(TABLE_NAME)
      .select(
        "submission_type",
        "timestamp",
        "l2_block_number",
        this.knex.raw(
          "timestamp - LAG(timestamp) OVER (PARTITION BY submission_type ORDER BY timestamp) AS time_diff",
        ),
        this.knex.raw(
          "l2_block_number - LAG(l2_block_number) OVER (PARTITION BY submission_type ORDER BY timestamp) AS block_diff",
        ),
      )
      .where("chain_id", chainId)
      .as("a");

    if (from) subquery = subquery.where("timestamp", ">=", from);
    if (to) subquery = subquery.where("timestamp", "<", to);

    const groupExpression = `DATE_TRUNC('${rangeMapping[groupRange]}', timestamp)`;

    const rows = await this.knex
      .select<SubmissionIntervalRow[]>(
        "submission_type",
        this.knex.raw(`${groupExpression} as timestamp`),
        this.knex.raw("EXTRACT(EPOCH FROM AVG(time_diff)) as time_diff"),
        this.knex.raw("AVG(block_diff)::INTEGER as block_diff"),
      )
      .from(subquery)
      .groupBy("submission_type")
      .groupByRaw(groupExpression);

    const result = new Map<SubmissionType, SubmissionInterval[]>(
      Object.values(SubmissionType).map((st) => [
        st as SubmissionType,
        [] as SubmissionInterval[],
      ]),
    );

    for (const row of rows) {
      const diffs = result.get(row.submission_type);
      if (diffs) {
        diffs.push({
          timestamp: row.timestamp,
          timeDiff: row.time_diff,
          blockDiff: row.block_diff,
        });
      }
    }

    return result;
  }

  async getVarHistory(
    chainId: number,
    submission_type?: SubmissionType,
    from?: Date,
    to?: Date,
    precision?: number,
  ): Promise<BlockVarViewModel[]> {
    const details = await this.getVarHistoryDetails(
      chainId,
      submission_type,
      from,
      to,
      precision,
    );
    return details.blocks;
  }

  getDefaultSubmissionType(chainId: number): SubmissionType {
    return (
      Object.values(chains).filter(
        (c) => c.chainId == chainId && "defaultSyncStatus" in c,
      )[0] as any
    )["defaultSyncStatus"] as SubmissionType;
  }

  private async getVarHistoryDetails(
    chainId: number,
    submission_type?: SubmissionType,
    from?: Date,
    to?: Date,
    precision?: number,
    includeStart: boolean = false,
  ): Promise<{ blocks: BlockVarViewModel[]; subNums: Set<number> }> {
    let preBlocks: BlockValueRecord[] | null = null;
    let blocksQuery = this.knex(chainTableMapping[chainId]);
    const defaultValue = { blocks: [], subNums: new Set<number>() };

    submission_type ??= this.getDefaultSubmissionType(chainId);

    if (from) {
      blocksQuery = blocksQuery.where("l2_block_timestamp", ">=", from);
    } else {
      // Take from last state submission
      const lastSubmission = await this.knex(TABLE_NAME)
        .where("chain_id", chainId)
        .where("submission_type", submission_type)
        .orderBy("l2_block_number", "desc")
        .select<{ l2_block_number: string }[]>("l2_block_number")
        .first();

      if (!lastSubmission) return defaultValue;

      preBlocks = [];
      blocksQuery = blocksQuery.where(
        "l2_block_number",
        ">=",
        Number(lastSubmission.l2_block_number),
      );
    }

    if (to) {
      blocksQuery = blocksQuery.where("l2_block_timestamp", "<=", to);
    }

    const blocks = await blocksQuery
      .orderBy("l2_block_number")
      .select<BlockValueRecord[]>();

    if (!blocks.length) return defaultValue;

    const blockNumbers = {
      min: Number(blocks[0].l2_block_number),
      max: Number(blocks[blocks.length - 1].l2_block_number),
    };

    const submissions = await this.knex
      .union(
        [
          this.knex(TABLE_NAME)
            .where("chain_id", chainId)
            .where("submission_type", submission_type)
            .where("l2_block_number", ">=", blockNumbers.min)
            .where("l2_block_number", "<=", blockNumbers.max)
            .select("l2_block_number"),
          this.knex(TABLE_NAME)
            .where("chain_id", chainId)
            .where("submission_type", submission_type)
            .where("l2_block_number", "<=", blockNumbers.min)
            .orderBy("l2_block_number", "desc")
            .select("l2_block_number")
            .limit(1),
        ],
        true,
      )
      .orderBy("l2_block_number", "asc")
      .select<{ l2_block_number: string }[]>("l2_block_number");

    if (!submissions.length) return defaultValue;

    if (!preBlocks) {
      const preBlockNumbers = {
        min: Number(submissions[0].l2_block_number),
        max: blockNumbers.min - 1,
      };

      preBlocks = await this.knex(chainTableMapping[chainId])
        .where("l2_block_number", ">=", preBlockNumbers.min)
        .where("l2_block_number", "<=", preBlockNumbers.max)
        .orderBy("l2_block_number")
        .select<BlockValueRecord[]>();
    }

    const submissionNumbers = new Set(
      submissions.map((s) => Number(s.l2_block_number)),
    );

    const entries = preBlocks
      .map((b) => ({ block: b, include: includeStart }))
      .concat(blocks.map((b) => ({ block: b, include: true })));

    let lastTime = 0;
    const result: BlockVarViewModel[] = [];
    let currentVar: ValueMapping = { byType: {}, byContract: {} };
    for (const entry of entries) {
      const block = entry.block;

      if (submissionNumbers.has(Number(block.l2_block_number)))
        currentVar = { byType: {}, byContract: {} };
      currentVar = mergeValues([currentVar, getValue(block)], true);

      if (!entry.include) continue;

      if (precision) {
        const blockTime = block.l2_block_timestamp.getTime();
        if ((blockTime - lastTime) / 1000 < precision) continue;
        lastTime = blockTime;
      }

      result.push({
        block_number: Number(block.l2_block_number),
        timestamp: block.l2_block_timestamp,
        by_contract: this.getVarByContractViewModels(
          chainId,
          currentVar.byContract,
        ),
        by_type: this.getVarByTypeViewModels(currentVar.byType),
      });
    }

    return { blocks: result, subNums: submissionNumbers };
  }

  private getVarByContractViewModels(
    chainId: number,
    value: ValueByContract | undefined,
  ): VarByContractViewModel[] {
    if (!value) return [];

    return Object.entries(value).map((x) => ({
      symbol: whitelistedMap.getSymbolByAddress(chainId, x[0]),
      address: x[0],
      var: x[1]?.value_asset ?? 0,
      var_usd: x[1]?.value_usd ?? 0,
    }));
  }

  private getVarByTypeViewModels(
    value: ValueByType | undefined,
  ): VarByTypeViewModel[] {
    if (!value) return [];

    return Object.entries(value).map((x) => ({
      type: x[0] as ValueType,
      var: x[1]?.value_asset,
      var_usd: x[1]?.value_usd,
    }));
  }
}

export default SyncStatusRepository;
