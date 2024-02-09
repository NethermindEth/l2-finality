import { Knex } from "knex";

export const TABLE_NAME = "l2_block_values";

export interface ContractValue {
  [contractAddress: string]: number;
}

export interface BlockValueRecord {
  chain_id: number;
  l2_block_number: bigint;
  l2_block_hash: string;
  l2_block_timestamp: Date;
  value: ContractValue;
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
    const result = await this.knex(TABLE_NAME)
      .select<BlockValueRecord[]>()
      .where("chain_id", chainId)
      .andWhere("l2_block_number", ">=", startBlock)
      .andWhere("l2_block_number", "<=", endBlock);

    return result.length > 0 ? result : null;
  }

  async getBetweenTimestamps(
    chainId: number,
    startTime: Date,
    endTime: Date,
  ): Promise<BlockValueRecord[] | null> {
    const result = await this.knex(TABLE_NAME)
      .select<BlockValueRecord[]>()
      .where("chain_id", chainId)
      .andWhere("l2_block_timestamp", ">=", startTime)
      .andWhere("l2_block_timestamp", "<=", endTime);

    return result.length > 0 ? result : null;
  }

  async insertOrUpdateBlockValue(
    chainId: number,
    l2BlockNumber: bigint,
    l2BlockHash: string,
    l2BlockTimestamp: Date,
    value: ContractValue,
  ): Promise<void> {
    const data: BlockValueRecord = {
      chain_id: chainId,
      l2_block_number: l2BlockNumber,
      l2_block_hash: l2BlockHash,
      l2_block_timestamp: l2BlockTimestamp,
      value: value,
    };

    await this.knex(TABLE_NAME)
      .insert(data)
      .onConflict(["chain_id", "l2_block_number", "l2_block_hash"])
      .merge();
  }
}

export default BlockValueRepository;
