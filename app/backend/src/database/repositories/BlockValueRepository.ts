import { Knex } from "knex";

export const chainTableMapping: Record<number, string> = {
  10: "optimism_blocks",
};

export interface ContractValue {
  [contractAddress: string]: number;
}

export interface BlockValueRecord {
  l2_block_number: bigint;
  l2_block_hash: string;
  l2_block_timestamp: Date;
  value: ContractValue;
}

export class BlockValueRepository {
  private readonly knex: Knex;
  private readonly chainId: number;

  private readonly tableName: string;
  constructor(knex: Knex, chainId: number) {
    this.knex = knex;
    this.chainId = chainId;

    if (!chainTableMapping[chainId]) {
      throw new Error(
        `Chain ID ${chainId} is not supported by BlockValueRepository, please add migrations`,
      );
    }

    this.tableName = chainTableMapping[chainId];
  }

  async getBetweenBlocks(
    startBlock: number,
    endBlock: number,
  ): Promise<BlockValueRecord[] | null> {
    const result = await this.knex(this.tableName)
      .select<BlockValueRecord[]>()
      .where("l2_block_number", ">=", startBlock)
      .andWhere("l2_block_number", "<=", endBlock);

    return result.length > 0 ? result : null;
  }

  async getBetweenTimestamps(
    startTime: Date,
    endTime: Date,
  ): Promise<BlockValueRecord[] | null> {
    const result = await this.knex(this.tableName)
      .select<BlockValueRecord[]>()
      .where("l2_block_timestamp", ">=", startTime)
      .andWhere("l2_block_timestamp", "<=", endTime);

    return result.length > 0 ? result : null;
  }

  async upsertRecord(record: BlockValueRecord): Promise<void> {
    await this.knex(this.tableName)
      .insert(record)
      .onConflict(["l2_block_number", "l2_block_hash"])
      .merge();
  }

  async upsertMany(records: BlockValueRecord[]): Promise<void> {
    await this.knex(this.tableName)
      .insert(records)
      .onConflict(["l2_block_number", "l2_block_hash"])
      .merge();
  }

  async getLatestBlockNumber(): Promise<bigint | null> {
    const result = await this.knex(this.tableName)
      .select("l2_block_number")
      .orderBy("l2_block_number", "desc")
      .first();

    return result ? BigInt(result.l2_block_number) : null;
  }
}

export default BlockValueRepository;
