import BlockIndexerController, {
  BlockIndexerConfig,
} from "@/core/controllers/indexers/shared/BlockIndexerController";
import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config";
import PolygonZkEvmClient from "@/core/clients/blockchain/polygonzk/PolygonZkEvmClient";
import { BlockAppraiser } from "@/core/controllers/appraiser/BlockAppraiser";

class PolygonZkEvmBlockController extends BlockIndexerController {
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
      blockAppraiser,
      polygonZkEvmIndexerConfig,
      database,
      logger.for("PolygonZkEvm Block Controller"),
    );
  }
}

export default PolygonZkEvmBlockController;
