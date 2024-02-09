import { Knex } from "knex";

export const TABLE_NAME = "sync_status";

export enum SubmissionType {
  DataSubmission = "data_submission",
  ProofSubmission = "proof_submission",
  StateUpdates = "state_updates",
}
export interface SyncStatusRecord {
  chain_id: number;
  l2_block_number: bigint;
  l2_block_hash: string;
  l1_block_number?: number | null;
  l1_block_hash?: string | null;
  timestamp: Date;
  submission_type: SubmissionType;
}

export class SyncStatusRepository {
  private readonly knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async insertSyncStatus(syncStatus: SyncStatusRecord): Promise<void> {
    await this.knex(TABLE_NAME).insert(syncStatus);
  }
}

export default SyncStatusRepository;
