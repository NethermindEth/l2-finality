import BlockIndexerController, {
  BlockIndexerConfig,
} from "@/core/controllers/indexers/shared/BlockIndexerController";
import OptimismClient from "@/core/clients/optimism/OptimismClient";
import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config";
import { BlockValueRecord } from "@/database/repositories/BlockValueRepository";

class OptimismBlockController extends BlockIndexerController {
  private optimismClient: OptimismClient;

  constructor(
    optimismClient: OptimismClient,
    config: Config,
    database: Database,
    logger: Logger,
  ) {
    const optimismIndexerConfig: BlockIndexerConfig = {
      chainId: config.optimismModule.chainId,
      maxBlockRange: config.optimismModule.maxBlockRange,
      startBlockEnvVar: config.optimismModule.startBlock,
    };

    super(
      optimismClient,
      optimismIndexerConfig,
      database,
      logger.for("Optimism Block Controller"),
    );
    this.optimismClient = optimismClient;
  }

  protected async fetchBlocks(
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    const recordsToAdd: BlockValueRecord[] = [];
    this.logger.debug(
      `Fetching Optimism blocks for range: ${fromBlock} to block ${toBlock}`,
    );
    for (let startBlock = fromBlock; startBlock <= toBlock; startBlock++) {
      const [block, txs] = await this.optimismClient.getBlock(startBlock);

      if (block && block.hash) {
        const record: BlockValueRecord = {
          l2_block_number: BigInt(startBlock),
          l2_block_hash: block.hash.toString(),
          l2_block_timestamp: new Date(block.timestamp * 1000),
          value: {}, // TODO: Add ERC-20 valuator
        };
        recordsToAdd.push(record);
      }
    }
    await this.blockValueRepository.upsertMany(this.chainId, recordsToAdd);
  }
}

export default OptimismBlockController;
