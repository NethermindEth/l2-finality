import { expect } from "earl";
import { Knex } from "knex";
import BlockValueRepository, {
  BlockValueRecord,
  chainTableMapping,
} from "./BlockValueRepository";
import { getTestDatabase } from "@/database/getTestDatabase";

describe(BlockValueRepository.name, () => {
  const chainId: number = 10;
  let repository: BlockValueRepository;
  let knexInstance: Knex;

  beforeEach(async () => {
    knexInstance = await getTestDatabase();
    repository = new BlockValueRepository(knexInstance);
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
    it("inserts a new block value record with block reward summary", async () => {
      const blockValueRecord: BlockValueRecord = {
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l2_block_timestamp: new Date(),
        value_by_contract: {
          ["0xABC"]: {
            value_asset: 10,
            value_usd: 10,
          },
        },
        value_by_type: {
          gas_fees: {
            value_asset: 100,
            value_usd: 10,
          },
          block_reward: {
            value_asset: 100,
            value_usd: 10,
          },
        },
      };

      await repository.upsertRecord(chainId, blockValueRecord);
      const result = await knexInstance(chainTableMapping[chainId])
        .where("l2_block_number", blockValueRecord.l2_block_number.toString())
        .first();
      const formattedResult = {
        ...result,
        l2_block_number: BigInt(result.l2_block_number),
      };

      expect(formattedResult).toEqual(blockValueRecord);
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
        await repository.upsertRecord(chainId, record);
      }).toBeRejected();
    });
  });

  describe(BlockValueRepository.prototype.getBetweenBlocks.name, () => {
    it("retrieves block value records between specified block numbers", async () => {
      const record: BlockValueRecord = {
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l2_block_timestamp: new Date(),
        value_by_contract: {
          ["0xABC"]: {
            value_asset: 10,
            value_usd: 10,
          },
          ["xxx"]: {
            value_asset: 0,
            value_usd: 0,
          },
        },
        value_by_type: {
          gas_fees: {
            value_asset: 100,
            value_usd: 10,
          },
          block_reward: {
            value_asset: 100,
            value_usd: 10,
          },
        },
      };
      await repository.upsertRecord(chainId, record);

      const result = await repository.getBetweenBlocks(chainId, 50, 150);
      expect(result!).not.toBeEmpty();
      expect(result!.length).toEqual(1);
      expect(
        result![0].l2_block_number >= 50n && result![0].l2_block_number <= 150n,
      ).toEqual(true);
    });
  });

  describe(BlockValueRepository.prototype.getBetweenTimestamps.name, () => {
    it("retrieves block value records between specified timestamps", async () => {
      const record: BlockValueRecord = {
        l2_block_number: 100n,
        l2_block_hash: "0x123",
        l2_block_timestamp: new Date(),
        value_by_contract: {
          ["0xABC"]: {
            value_asset: 10,
            value_usd: 10,
          },
        },
        value_by_type: {
          gas_fees: {
            value_asset: 100,
            value_usd: 10,
          },
          block_reward: {
            value_asset: 100,
            value_usd: 10,
          },
        },
      };
      await repository.upsertRecord(chainId, record);

      const startTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const endTime = new Date();

      const result = await repository.getBetweenTimestamps(
        chainId,
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
