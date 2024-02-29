import BlockIndexerController, {
  BlockIndexerConfig,
} from "@/core/controllers/indexers/shared/BlockIndexerController";
import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config";
import { BlockValueRecord } from "@/database/repositories/BlockValueRepository";
import PolygonZkEvmClient from "@/core/clients/blockchain/polygonzk/PolygonZkEvmClient";
import { BlockValue } from "@/core/controllers/appraiser/types";
import { BlockAppraiser } from "@/core/controllers/appraiser/BlockAppraiser";

class PolygonZkEvmBlockController extends BlockIndexerController {
  private polygonZkEvmClient: PolygonZkEvmClient;
  private blockAppraiser: BlockAppraiser;

  constructor(
    polygonZkEvmClient: PolygonZkEvmClient,
    blockAppraiser: BlockAppraiser,
    config: Config,
    database: Database,
    logger: Logger,
  ) {
    const polygonZkEvmIndexerConfig: BlockIndexerConfig = {
      chainId: config.polygonZkEvmModule.chainId,
      maxBlockRange: config.polygonZkEvmModule.maxBlockRange,
      startBlockEnvVar: config.polygonZkEvmModule.startBlock,
    };

    super(
      polygonZkEvmClient,
      polygonZkEvmIndexerConfig,
      database,
      logger.for("PolygonZkEvm Block Controller"),
    );
    this.polygonZkEvmClient = polygonZkEvmClient;
    this.blockAppraiser = blockAppraiser;
  }

  protected async fetchBlocks(
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    const recordsToAdd: BlockValueRecord[] = [];
    this.logger.debug(
      `Fetching PolygonZkEvm blocks for range: ${fromBlock} to block ${toBlock}`,
    );
    for (let startBlock = fromBlock; startBlock <= toBlock; startBlock++) {
      const block = await this.polygonZkEvmClient.getBlock(startBlock);

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

export default PolygonZkEvmBlockController;
