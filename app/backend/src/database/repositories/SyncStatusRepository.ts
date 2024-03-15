import { Knex } from "knex";
import { UnixTime } from "@/core/types/UnixTime";
import { chainTableMapping } from "@/database/repositories/BlockValueRepository";

export const TABLE_NAME = "sync_status";

export enum SubmissionType {
  DataSubmission = "data_submission",
  L2Finalization = "l2_finalization",
  ProofSubmission = "proof_submission",
  StateUpdates = "state_updates",
}

export interface SyncStatusRecord {
  chain_id: number;
  l2_block_number: bigint;
  l2_block_hash: string | null;
  l1_block_number: number | null;
  l1_block_hash: string | null;
  timestamp: Date;
  submission_type: SubmissionType;
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

export interface AvgVarHistoryEntry {
  timestamp: Date;
  avg_var: number;
}

export type AvgVarHistoryMap = {
  [submission in SubmissionType]: {
    [contract: string]: AvgVarHistoryEntry[];
  };
};

interface AvgVarHistoryRow {
  submission_type: SubmissionType;
  contract_address: string;
  timestamp: Date;
  avg: number;
}

export type ActiveVarMap = {
  [submission in SubmissionType]: {
    [contract: string]: number;
  };
};

interface ActiveVarRow {
  submission_type: SubmissionType;
  contract_address: string;
  total: number;
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

  async getPaginatedSyncStatus(
    chainId: number,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<SyncStatusRecord[]> {
    const offset = (page - 1) * pageSize;
    return this.knex(TABLE_NAME)
      .select(
        "l2_block_number",
        "l2_block_hash",
        "l1_block_number",
        "l1_block_hash",
        "timestamp",
        "submission_type",
      )
      .where("chain_id", chainId)
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

  async getAverageValueAtRiskHistory(
    chainId: number,
    groupRange: GroupRange,
    from?: Date,
    to?: Date,
  ): Promise<AvgVarHistoryMap> {
    const rangeGroupExpression = `DATE_TRUNC('${rangeMapping[groupRange]}', timestamp)`;

    let submissions = this.knex
      .table(TABLE_NAME)
      .where("chain_id", chainId)
      .groupBy("submission_type")
      .groupByRaw(rangeGroupExpression)
      .select(
        "submission_type",
        this.knex.raw(`${rangeGroupExpression} as timestamp`),
        this.knex.raw("count(*) as submissions_count"),
      );

    if (from) submissions = submissions.where("timestamp", ">=", from);
    if (to) submissions = submissions.where("timestamp", "<", to);

    let contracts = this.knex
      .table(chainTableMapping[chainId])
      .select(
        this.knex.raw("jsonb_array_elements(value->'mapped') as cval"),
        "l2_block_timestamp as timestamp",
      );

    if (from) contracts = contracts.where("l2_block_timestamp", ">=", from);
    if (to) contracts = contracts.where("l2_block_timestamp", "<", to);

    const contract_value = this.knex
      .select(
        this.knex.raw(`${rangeGroupExpression} as timestamp`),
        this.knex.raw("cval->>'contractAddress' as contract_address"),
        this.knex.raw("sum((cval->>'usdTotalValue')::float) as total"),
      )
      .from(contracts.as("c"))
      .groupByRaw("cval->>'contractAddress'")
      .groupByRaw(rangeGroupExpression);

    const rows = await this.knex
      .with("range_submissions", submissions)
      .with("range_contract_value", contract_value)
      .select<
        AvgVarHistoryRow[]
      >("submission_type", "contract_address", "range_submissions.timestamp", this.knex.raw("total / (submissions_count + 1) as avg"))
      .from("range_submissions")
      .join(
        "range_contract_value",
        "range_submissions.timestamp",
        "range_contract_value.timestamp",
      )
      .orderBy("submission_type")
      .orderBy("contract_address")
      .orderBy("timestamp", "desc");

    const result = Object.fromEntries(
      Object.values(SubmissionType).map((st) => [
        st as SubmissionType,
        {} as { [contract: string]: AvgVarHistoryEntry[] },
      ]),
    );

    for (const row of rows) {
      const contractVars = result[row.submission_type];
      if (contractVars) {
        contractVars[row.contract_address] ??= [] as AvgVarHistoryEntry[];
        contractVars[row.contract_address].push({
          timestamp: row.timestamp,
          avg_var: row.avg,
        });
      }
    }

    return result as AvgVarHistoryMap;
  }

  async getActiveValueAtRisk(chainId: number): Promise<ActiveVarMap> {
    const last_submission = this.knex
      .table(TABLE_NAME)
      .where("chain_id", chainId)
      .groupBy("submission_type")
      .select(
        "submission_type",
        this.knex.raw(`max(l2_block_number) as block`),
      );

    const contract_value = this.knex
      .select(
        "submission_type",
        this.knex.raw("jsonb_array_elements(value->'mapped') as cval"),
      )
      .from(chainTableMapping[chainId])
      .crossJoin("last_submission" as any)
      .whereRaw("l2_block_number > last_submission.block");

    const rows = await this.knex
      .with("last_submission", last_submission)
      .with("contract_value", contract_value)
      .select<
        ActiveVarRow[]
      >("submission_type", this.knex.raw("cval->>'contractAddress' as contract_address"), this.knex.raw("sum((cval->>'usdTotalValue')::float) as total"))
      .from("contract_value")
      .groupBy("submission_type")
      .groupByRaw("cval->>'contractAddress'")
      .orderBy("submission_type")
      .orderBy("contract_address");

    const result = Object.fromEntries(
      Object.values(SubmissionType).map((st) => [
        st as SubmissionType,
        {} as { [contract: string]: number },
      ]),
    );

    for (const row of rows) {
      const contractVars = result[row.submission_type];
      if (contractVars) {
        contractVars[row.contract_address] = row.total;
      }
    }

    return result as ActiveVarMap;
  }
}

export default SyncStatusRepository;
