import BlockIndexerController, {
  BlockIndexerConfig,
} from "@/core/controllers/indexers/shared/BlockIndexerController";
import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config";
import { BlockAppraiser } from "@/core/controllers/appraiser/BlockAppraiser";
import StarknetClient from "@/core/clients/blockchain/starknet/StarknetClient";

class StarknetBlockController extends BlockIndexerController {
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
      blockAppraiser,
      starknetIndexerConfig,
      database,
      logger.for("Starknet Block Controller"),
    );
  }
}

export default StarknetBlockController;
