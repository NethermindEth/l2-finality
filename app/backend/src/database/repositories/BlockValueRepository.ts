import { Knex } from "knex";
import { AggregatedTransferResults } from "@/core/controllers/appraiser/types";

export const chainTableMapping: Record<number, string> = {
  10: "optimism_blocks",
};

export interface BlockValueRecord {
  l2_block_number: bigint;
  l2_block_hash: string;
  l2_block_timestamp: Date;
  value: AggregatedTransferResults;
  gas_fees: bigint;
  gas_fees_usd: number;
  block_reward: bigint;
  block_reward_usd: number;
}

export class BlockValueRepository {
  private readonly knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async getBetweenBlocks(
    chainId: number,
    startBlock: number,
    endBlock: number,
  ): Promise<BlockValueRecord[] | null> {
    const tableName = this.getTable(chainId);
    const result = await this.knex(tableName)
      .select<BlockValueRecord[]>()
      .where("l2_block_number", ">=", startBlock)
      .andWhere("l2_block_number", "<=", endBlock);

    return result.length > 0 ? result : null;
  }

  async getBetweenTimestamps(
    chainId: number,
    startTime: Date,
    endTime: Date,
  ): Promise<BlockValueRecord[] | null> {
    const tableName = this.getTable(chainId);
    const result = await this.knex(tableName)
      .select<BlockValueRecord[]>()
      .where("l2_block_timestamp", ">=", startTime)
      .andWhere("l2_block_timestamp", "<=", endTime);

    return result.length > 0 ? result : null;
  }

  async upsertRecord(chainId: number, record: BlockValueRecord): Promise<void> {
    await this.upsertMany(chainId, [record]);
  }

  async upsertMany(
    chainId: number,
    records: BlockValueRecord[],
  ): Promise<void> {
    const tableName = this.getTable(chainId);
    const serializedRecords = records.map((record) => ({
      ...record,
      value: JSON.stringify({
        ...record.value,
        unmapped: record.value.unmapped.map((item) => ({
          ...item,
          rawTotalAmount: item.rawTotalAmount.toString(),
        })),
      }),
      gas_fees: record.gas_fees.toString(),
      block_reward: record.block_reward.toString(),
    }));

    await this.knex(tableName)
      .insert(serializedRecords)
      .onConflict(["l2_block_number", "l2_block_hash"])
      .merge();
  }

  async getLatestBlockNumber(
    chainId: number,
  ): Promise<{ l2_block_number: bigint; l2_block_timestamp: Date } | null> {
    const tableName = this.getTable(chainId);
    const result = await this.knex(tableName)
      .select("l2_block_number", "l2_block_timestamp")
      .orderBy("l2_block_number", "desc")
      .first();

    return result
      ? {
          l2_block_number: result.l2_block_number,
          l2_block_timestamp: new Date(result.l2_block_timestamp),
        }
      : null;
  }

  private getTable(chainId: number): string {
    if (!chainTableMapping[chainId]) {
      throw new Error(
        `Chain ID ${chainId} is not supported by BlockValueRepository, please add migrations`,
      );
    }
    return chainTableMapping[chainId];
  }
}

export default BlockValueRepository;
