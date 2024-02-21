import BlockIndexerController, {
  BlockIndexerConfig,
} from "@/core/controllers/indexers/shared/BlockIndexerController";
import OptimismClient from "@/core/clients/blockchain/optimism/OptimismClient";
import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config";
import { BlockValueRecord } from "@/database/repositories/BlockValueRepository";
import { BlockAppraiser } from "@/core/controllers/appraiser/BlockAppraiser";
import { BlockValue } from "@/core/controllers/appraiser/types";

class OptimismBlockController extends BlockIndexerController {
  private optimismClient: OptimismClient;
  private blockAppraiser: BlockAppraiser;

  constructor(
    optimismClient: OptimismClient,
    blockAppraiser: BlockAppraiser,
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
    this.blockAppraiser = blockAppraiser;
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
      const block = await this.optimismClient.getBlock(startBlock);

      if (block) {
        const appraisal: BlockValue = await this.blockAppraiser.value(block);

        const record: BlockValueRecord = {
          l2_block_number: BigInt(startBlock),
          l2_block_hash: block.hash.toString(),
          l2_block_timestamp: new Date(block.timestamp * 1000),
          gas_fees: appraisal.blockRewardSummary.gasFees,
          gas_fees_usd: appraisal.blockRewardSummary.gasFeesUsd,
          block_reward: appraisal.blockRewardSummary.blockReward,
          block_reward_usd: appraisal.blockRewardSummary.blockRewardUsd,
          value: appraisal.transferSummary,
        };
        recordsToAdd.push(record);
      }
    }
    await this.blockValueRepository.upsertMany(this.chainId, recordsToAdd);
  }
}

export default OptimismBlockController;
