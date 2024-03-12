import BlockIndexerController, {
  BlockIndexerConfig,
} from "@/core/controllers/indexers/shared/BlockIndexerController";
import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config";
import { BlockValueRecord } from "@/database/repositories/BlockValueRepository";
import { BlockAppraiser } from "@/core/controllers/appraiser/BlockAppraiser";
import { BlockValue } from "@/core/controllers/appraiser/types";
import StarknetClient from "@/core/clients/blockchain/starknet/StarknetClient";

class StarknetBlockController extends BlockIndexerController {
  private readonly starknetClient: StarknetClient;
  private readonly blockAppraiser: BlockAppraiser;

  constructor(
    starknetClient: StarknetClient,
    blockAppraiser: BlockAppraiser,
    config: Config,
    database: Database,
    logger: Logger,
  ) {
    const starknetIndexerConfig: BlockIndexerConfig = {
      chainId: config.starknetModule.chainId,
      maxBlockRange: config.starknetModule.maxBlockRange,
      startBlockEnvVar: config.starknetModule.startBlock,
    };

    super(
      starknetClient,
      starknetIndexerConfig,
      database,
      logger.for("Starknet Block Controller"),
    );
    this.starknetClient = starknetClient;
    this.blockAppraiser = blockAppraiser;
  }

  protected async fetchBlocks(
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    const recordsToAdd: BlockValueRecord[] = [];
    this.logger.debug(
      `Fetching Starknet blocks for range: ${fromBlock} to block ${toBlock}`,
    );
    for (let startBlock = fromBlock; startBlock <= toBlock; startBlock++) {
      const block = await this.starknetClient.getBlock(startBlock);

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

export default StarknetBlockController;
