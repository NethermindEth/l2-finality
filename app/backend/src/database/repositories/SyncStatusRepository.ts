import { Knex } from "knex";

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
}

export default SyncStatusRepository;
