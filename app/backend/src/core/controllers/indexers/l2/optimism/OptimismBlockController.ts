import BlockIndexerController, {
  BlockIndexerConfig,
} from "@/core/controllers/indexers/shared/BlockIndexerController";
import OptimismClient from "@/core/clients/blockchain/optimism/OptimismClient";
import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config";
import { BlockAppraiser } from "@/core/controllers/appraiser/BlockAppraiser";

class OptimismBlockController extends BlockIndexerController {
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
      blockAppraiser,
      optimismIndexerConfig,
      database,
      logger.for("Optimism Block Controller"),
    );
  }
}

export default OptimismBlockController;
