import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import BlockValueRepository, {
  BlockValueRecord,
} from "@/database/repositories/BlockValueRepository";
import { ValueMapping } from "@/core/controllers/appraiser/types";
import { BlockAppraiser } from "@/core/controllers/appraiser/BlockAppraiser";
import { IBlockchainClient } from "@/core/clients/blockchain/IBlockchainClient";

export interface BlockIndexerConfig {
  chainId: number;
  maxBlockRange: number;
  startBlockEnvVar: number;
}

abstract class BlockIndexerController {
  protected logger: Logger;
  protected indexerConfig: BlockIndexerConfig;
  protected database: Database;

  protected client: any;
  private blockAppraiser: BlockAppraiser;
  protected chainId: number;
  protected blockValueRepository: BlockValueRepository;

  protected readonly timeoutMs = 1000;

  protected constructor(
    client: IBlockchainClient,
    blockAppraiser: BlockAppraiser,
    indexerConfig: BlockIndexerConfig,
    database: Database,
    logger: Logger,
  ) {
    this.client = client;
    this.blockAppraiser = blockAppraiser;
    this.chainId = indexerConfig.chainId;
    this.logger = logger;
    this.indexerConfig = indexerConfig;
    this.database = database;

    this.blockValueRepository = new BlockValueRepository(
      this.database.getKnex(),
    );
  }

  public async start(): Promise<void> {
    const currentHeight = await this.client.getCurrentHeight();
    const fromBlock = await this.startFrom();

    const numberOfBatches = Math.ceil(
      (currentHeight - fromBlock + 1) / this.indexerConfig.maxBlockRange,
    );

    this.logger.info(
      `[chainId ${this.chainId}] Fetching blocks from ${fromBlock} to ${currentHeight} (${numberOfBatches} batches)`,
    );

    for (
      let startBlock = fromBlock, batch = 1;
      startBlock <= currentHeight;
      startBlock += this.indexerConfig.maxBlockRange + 1, batch++
    ) {
      const endBlock = Math.min(
        startBlock + this.indexerConfig.maxBlockRange,
        currentHeight,
      );

      await this.fetchBlocks(startBlock, endBlock);
      await new Promise((resolve) => setTimeout(resolve, this.timeoutMs));
    }
  }

  protected async fetchBlocks(
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    const recordsToAdd: BlockValueRecord[] = [];
    this.logger.debug(
      `Fetching blocks for range: ${fromBlock} to block ${toBlock}`,
    );
    for (let startBlock = fromBlock; startBlock <= toBlock; startBlock++) {
      const block = await this.client.getBlock(startBlock);
      if (!block) break;

      const valueMapping: ValueMapping = await this.blockAppraiser.value(block);

      const record: BlockValueRecord = {
        l2_block_number: BigInt(startBlock),
        l2_block_hash: block.hash.toString(),
        l2_block_timestamp: new Date(block.timestamp * 1000),
        value_by_contract: valueMapping.byContract ?? {},
        value_by_type: valueMapping.byType ?? {},
      };
      recordsToAdd.push(record);
    }

    await this.blockValueRepository.upsertMany(this.chainId, recordsToAdd);
  }

  protected async startFrom(): Promise<number> {
    const startBlock = await this.blockValueRepository.getLatestBlockNumber(
      this.chainId,
    );

    let startFrom: number;

    if (startBlock && typeof startBlock.l2_block_number !== "undefined") {
      startFrom = Number(startBlock.l2_block_number) + 1;
    } else {
      startFrom = Number(this.indexerConfig.startBlockEnvVar);
    }
    return startFrom;
  }
}

export default BlockIndexerController;
