import { expect } from "earl";
import { Knex } from "knex";
import BlockValueRepository, {
  BlockValueRecord,
  chainTableMapping,
} from "./BlockValueRepository";
import { Database } from "@/database/Database";
import { getTestDatabase } from "../getTestDatabase";
import { Block } from "ethers";

describe(BlockValueRepository.name, () => {
  let repository: BlockValueRepository;
  let knexInstance: Knex;

  beforeEach(async () => {
    knexInstance = await getTestDatabase();
    repository = new BlockValueRepository(knexInstance, 10);
  });

  afterEach(async () => {
    await knexInstance.destroy();
  });

  describe("Migration tests", () => {
    it("Tables are created for each chain_id", async () => {
      for (let chainId in chainTableMapping) {
        const tableName = chainTableMapping[chainId];
        const tableExists = await knexInstance.schema.hasTable(tableName);
        expect(tableExists).toEqual(true);
      }
    });
  });

  describe(BlockValueRepository.prototype.upsertRecord.name, () => {
    it("inserts a new block value record", async () => {
      const blockValue = {
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l2_block_timestamp: new Date(),
        value: { "0xABC": 1000 },
      };

      const record: BlockValueRecord = {
        l2_block_number: blockValue.l2_block_number,
        l2_block_hash: blockValue.l2_block_hash,
        l2_block_timestamp: blockValue.l2_block_timestamp,
        value: blockValue.value,
      };

      await repository.upsertRecord(record);

      const result = await knexInstance(chainTableMapping[10]).first();
      expect({
        ...result,
        l2_block_number: BigInt(result.l2_block_number),
      }).toEqual(blockValue);
    });

    it("throws an error or handles invalid input", async () => {
      const invalidValue = "invalid_value";
      const blockValue = {
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l2_block_timestamp: new Date(),
        value: invalidValue,
      };

      const record: BlockValueRecord = {
        l2_block_number: blockValue.l2_block_number,
        l2_block_hash: blockValue.l2_block_hash,
        l2_block_timestamp: blockValue.l2_block_timestamp,
        // @ts-expect-error
        value: blockValue.value,
      };

      await expect(async () => {
        await repository.upsertRecord(record);
      }).toBeRejected();
    });
  });

  describe(BlockValueRepository.prototype.getBetweenBlocks.name, () => {
    it("retrieves block value records between specified block numbers", async () => {
      const record = {
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l2_block_timestamp: new Date(),
        value: { "0xABC": 1000 },
      };
      await repository.upsertRecord(record);

      const result = await repository.getBetweenBlocks(50, 150);
      expect(result!).not.toBeEmpty();
      expect(result!.length).toEqual(1);
      expect(
        result![0].l2_block_number >= 50n && result![0].l2_block_number <= 150n,
      ).toEqual(true);
    });
  });

  describe(BlockValueRepository.prototype.getBetweenTimestamps.name, () => {
    it("retrieves block value records between specified timestamps", async () => {
      const record = {
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l2_block_timestamp: new Date(),
        value: { "0xABC": 1000 },
      };
      await repository.upsertRecord(record);

      const startTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const endTime = new Date();

      const result = await repository.getBetweenTimestamps(startTime, endTime);
      expect(result!).not.toBeEmpty();
      expect(result!.length).toEqual(1);
      expect(
        result![0].l2_block_timestamp >= startTime &&
          result![0].l2_block_timestamp <= endTime,
      ).toEqual(true);
    });
  });
});
