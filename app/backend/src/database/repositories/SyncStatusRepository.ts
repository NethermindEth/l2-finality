import { Knex } from "knex";
import { UnixTime } from "@/core/types/UnixTime";

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

export interface StateDiff {
  timestamp: Date;
  timeDiff: UnixTime;
  blockDiff: number;
}

interface StateDiffRow {
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

  async getAverageStateDiff(
    chainId: number,
    groupRange: GroupRange,
    from?: Date,
    to?: Date,
  ): Promise<Map<SubmissionType, StateDiff[]>> {
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
      .select<StateDiffRow[]>(
        "submission_type",
        this.knex.raw(`${groupExpression} as timestamp`),
        this.knex.raw("EXTRACT(EPOCH FROM AVG(time_diff)) as time_diff"),
        this.knex.raw("AVG(block_diff)::INTEGER as block_diff"),
      )
      .from(subquery)
      .groupBy("submission_type")
      .groupByRaw(groupExpression);

    const result = new Map<SubmissionType, StateDiff[]>(
      Object.values(SubmissionType).map((st) => [
        st as SubmissionType,
        [] as StateDiff[],
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
}

export default SyncStatusRepository;
