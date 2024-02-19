import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import BlockValueRepository from "@/database/repositories/BlockValueRepository";

export interface BlockIndexerConfig {
  chainId: number;
  maxBlockRange: number;
  startBlockEnvVar: number;
}

class BlockIndexerController {
  protected logger: Logger;
  protected indexerConfig: BlockIndexerConfig;
  protected database: Database;

  protected client: any;
  protected chainId: number;
  protected blockValueRepository: BlockValueRepository;

  protected readonly timeoutMs = 1000;

  constructor(
    client: any,
    indexerConfig: BlockIndexerConfig,
    database: Database,
    logger: Logger,
  ) {
    this.client = client;
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
    // Implement block fetching logic in child classes
    return;
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
