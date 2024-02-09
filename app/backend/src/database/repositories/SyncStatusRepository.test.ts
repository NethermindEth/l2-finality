// src/database/repositories/SyncStatusRepository.test.ts

import { Knex } from "knex";
import { expect } from "earl";
import {
  SyncStatusRecord,
  SubmissionType,
  SyncStatusRepository,
  TABLE_NAME,
} from "./SyncStatusRepository";
import { getTestDatabase } from "../getTestDatabase";

describe(SyncStatusRepository.name, () => {
  let repository: SyncStatusRepository;
  let knexInstance: Knex;

  beforeEach(async () => {
    knexInstance = await getTestDatabase();
    repository = new SyncStatusRepository(knexInstance);
  });

  afterEach(async () => {
    await knexInstance.destroy();
  });

  describe(SyncStatusRepository.prototype.insertSyncStatus.name, () => {
    it("inserts a new sync status record", async () => {
      const syncStatus: SyncStatusRecord = {
        chain_id: 1,
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l1_block_number: null,
        l1_block_hash: null,
        timestamp: new Date(),
        submission_type: SubmissionType.DataSubmission,
      };

      await repository.insertSyncStatus(syncStatus);
      const result = await knexInstance(TABLE_NAME)
        .where({ chain_id: 1 })
        .first();
      expect({
        ...result,
        l2_block_number: BigInt(result.l2_block_number),
      }).toEqual(syncStatus);
    });

    it("throws an error or handles invalid input", async () => {
      const invalidSyncStatus = {
        chain: "invalid_chain",
        l2_block_number: "invalid_block_number",
        l2_block_hash: "invalid_block_hash",
        l1_block_number: "invalid_block_number",
        l1_block_hash: "invalid_block_hash",
        timestamp: "invalid_timestamp",
        submission_type: "invalid_submission_type",
      };

      await expect(async () => {
        // @ts-ignore
        await repository.insertSyncStatus(
          invalidSyncStatus as SyncStatusRecord,
        );
      }).toBeRejected();
    });
  });
});
