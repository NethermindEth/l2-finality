import { expect } from "earl";
import { Knex } from "knex";
import BlockValueRepository, { TABLE_NAME } from "./BlockValueRepository";
import { Database } from "@/database/Database";
import { getTestDatabase } from "../getTestDatabase";
import { Block } from "ethers";

describe(BlockValueRepository.name, () => {
  let repository: BlockValueRepository;
  let knexInstance: Knex;

  beforeEach(async () => {
    knexInstance = await getTestDatabase();
    repository = new BlockValueRepository(knexInstance);
  });

  afterEach(async () => {
    await knexInstance.destroy();
  });

  describe(BlockValueRepository.prototype.insertOrUpdateBlockValue.name, () => {
    it("inserts a new block value record", async () => {
      const blockValue = {
        chain_id: 1,
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l2_block_timestamp: new Date(),
        value: { "0xABC": 1000 },
      };

      await repository.insertOrUpdateBlockValue(
        blockValue.chain_id,
        blockValue.l2_block_number,
        blockValue.l2_block_hash,
        blockValue.l2_block_timestamp,
        blockValue.value,
      );

      const result = await knexInstance(TABLE_NAME)
        .where({ chain_id: 1 })
        .first();
      expect({
        ...result,
        l2_block_number: BigInt(result.l2_block_number),
      }).toEqual(blockValue);
    });

    it("throws an error or handles invalid input", async () => {
      const invalidValue = "invalid_value";
      const blockValue = {
        chain_id: 1,
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l2_block_timestamp: new Date(),
        value: invalidValue,
      };

      await expect(async () => {
        await repository.insertOrUpdateBlockValue(
          blockValue.chain_id,
          blockValue.l2_block_number,
          blockValue.l2_block_hash,
          blockValue.l2_block_timestamp,
          // @ts-ignore
          blockValue.value,
        );
      }).toBeRejected();
    });
  });

  describe(BlockValueRepository.prototype.getBetweenBlocks.name, () => {
    it("retrieves block value records between specified block numbers", async () => {
      const result = await repository.getBetweenBlocks(1, 50, 150);
      expect(result!).not.toBeEmpty();
      expect(result!.length).toEqual(1);
      expect(
        result![0].l2_block_number >= 50n && result![0].l2_block_number <= 150n,
      ).toEqual(true);
    });
  });

  describe(BlockValueRepository.prototype.getBetweenTimestamps.name, () => {
    it("retrieves block value records between specified timestamps", async () => {
      const startTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const endTime = new Date();

      const result = await repository.getBetweenTimestamps(
        1,
        startTime,
        endTime,
      );
      expect(result!).not.toBeEmpty();
      expect(result!.length).toEqual(1);
      expect(
        result![0].l2_block_timestamp >= startTime &&
          result![0].l2_block_timestamp <= endTime,
      ).toEqual(true);
    });
  });
});
