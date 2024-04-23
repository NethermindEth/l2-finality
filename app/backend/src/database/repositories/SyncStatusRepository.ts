import { Knex } from "knex";
import { UnixTime } from "@/core/types/UnixTime";
import {
  BlockValueRecord,
  chainTableMapping,
} from "@/database/repositories/BlockValueRepository";
import {
  AverageDetailsViewModel,
  AverageVarViewModel,
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
import { whitelistedMap } from "@/core/clients/coingecko/assets/types";
import chains from "@/shared/chains.json";

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
  ): Promise<SyncStatusRecord | undefined> {
    type ??= this.getDefaultSubmissionType(chainId);

    return this.knex(TABLE_NAME)
      .where("chain_id", chainId)
      .where("submission_type", type)
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

  async getVarAverage(
    chainId: number,
    submission_type?: SubmissionType,
    from?: Date,
    to?: Date,
    precision?: number,
  ): Promise<AverageDetailsViewModel> {
    precision ??= 60;

    const result: AverageDetailsViewModel = {
      values: [],
      min_period_sec: 0,
      avg_period_sec: 0,
      max_period_sec: 0,
    };

    const history = await this.getVarHistoryDetails(
      chainId,
      submission_type,
      from,
      to,
      undefined,
      true,
    );

    if (history.blocks.length == 0) return result;

    const periods: number[] = [];
    const varsMap = new Map<number, BlockVarViewModel[]>();

    let sliceStartTime = 0;
    for (const block of history.blocks) {
      const blockTime = block.timestamp.getTime() / 1000;
      if (history.subNums.has(block.block_number)) {
        if (sliceStartTime != 0) periods.push(blockTime - sliceStartTime);

        sliceStartTime = blockTime;
      }

      let sliceTime = blockTime - sliceStartTime;
      sliceTime = sliceTime - (sliceTime % precision);

      if (block.timestamp < (from ?? block.timestamp)) continue;
      if (block.timestamp > (to ?? block.timestamp)) continue;

      if (!varsMap.get(sliceTime)) varsMap.set(sliceTime, []);
      varsMap.get(sliceTime)!.push(block);
    }

    const lastBlockTime =
      history.blocks.slice(-1)[0].timestamp.getTime() / 1000;
    if (sliceStartTime != lastBlockTime)
      periods.push(lastBlockTime - sliceStartTime);

    for (const period of periods) {
      if (!result.min_period_sec || period < result.min_period_sec)
        result.min_period_sec = period;
      if (!result.max_period_sec || period > result.max_period_sec)
        result.max_period_sec = period;
      result.avg_period_sec += period;
    }

    result.avg_period_sec /= periods.length;

    const times = Array.from(varsMap.keys());
    times.sort((a, b) => a - b);

    result.values = times.map((time) =>
      this.getAverageVarViewModel(chainId, time, varsMap.get(time)!),
    );

    return result;
  }

  getTotalVarUsd(block: BlockVarViewModel): number {
    let total = 0;
    for (const entry of block.by_type) {
      if (entry.type == ValueType.block_reward) continue;
      total += entry.var_usd;
    }
    return total;
  }

  async getVarHistoryDetails(
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

  getAverageVarViewModel(
    chainId: number,
    time: number,
    blocks: BlockVarViewModel[],
  ): AverageVarViewModel {
    const totals: {
      by_contract: ValueByContract;
      by_type: ValueByType;
    } = { by_contract: {}, by_type: {} };

    let minUsd = -1;
    let maxUsd = -1;

    for (const block of blocks) {
      const blockUsd = this.getTotalVarUsd(block);

      if (minUsd == -1 || blockUsd < minUsd) minUsd = blockUsd;
      if (maxUsd == -1 || blockUsd > maxUsd) maxUsd = blockUsd;

      if (block.by_contract) {
        for (const entry of block.by_contract) {
          const contract = entry.address;
          const totalVar =
            totals.by_contract[contract] ??
            (totals.by_contract[contract] = { value_asset: 0, value_usd: 0 });
          totalVar.value_asset += entry.var;
          totalVar.value_usd += entry.var_usd;
        }
      }

      if (block.by_type) {
        for (const entry of block.by_type) {
          const type = entry.type;
          const totalVar =
            totals.by_type[type] ??
            (totals.by_type[type] = { value_asset: 0, value_usd: 0 });
          totalVar.value_asset += entry.var;
          totalVar.value_usd += entry.var_usd;
        }
      }
    }

    for (const total of Object.values(totals.by_contract)) {
      total!.value_asset /= blocks.length;
      total!.value_usd /= blocks.length;
    }

    for (const total of Object.values(totals.by_type)) {
      total!.value_asset /= blocks.length;
      total!.value_usd /= blocks.length;
    }

    return {
      timestamp: time,
      min_var_usd: Math.max(minUsd, 0),
      max_var_usd: Math.max(maxUsd, 0),
      by_contract: this.getVarByContractViewModels(chainId, totals.by_contract),
      by_type: this.getVarByTypeViewModels(totals.by_type),
    };
  }

  getVarByContractViewModels(
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

  getVarByTypeViewModels(value: ValueByType | undefined): VarByTypeViewModel[] {
    if (!value) return [];

    return Object.entries(value).map((x) => ({
      type: x[0] as ValueType,
      var: x[1]?.value_asset,
      var_usd: x[1]?.value_usd,
    }));
  }

  private getDefaultSubmissionType(chainId: number): SubmissionType {
    return (
      Object.values(chains).filter(
        (c) => c.chainId == chainId && "defaultSyncStatus" in c,
      )[0] as any
    )["defaultSyncStatus"] as SubmissionType;
  }
}

export default SyncStatusRepository;
