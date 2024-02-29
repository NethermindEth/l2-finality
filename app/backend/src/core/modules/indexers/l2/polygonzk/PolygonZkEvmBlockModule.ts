import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config/Config";
import { TaskScheduler } from "@/core/scheduler/TaskScheduler";
import PolygonZkEvmClient from "@/core/clients/blockchain/polygonzk/PolygonZkEvmClient";
import PolygonZkEvmBlockController from "@/core/controllers/indexers/l2/polygonzk/PolygonZkEvmBlockController";
import { createBlockAppraiser } from "@/core/controllers/appraiser/getAppraiser";

export function createPolygonZkEvmBlockModule(
  config: Config,
  logger: Logger,
  database: Database,
  polygonZkEvmClient: PolygonZkEvmClient,
): { start: () => Promise<void> } {
  const loggerContext = "PolygonZkEVM Blocks";

  const blockAppraiser = createBlockAppraiser(
    polygonZkEvmClient,
    config,
    logger.for("ZkEVM Appraiser"),
    database,
  );

  const polygonZkEvmBlockController = new PolygonZkEvmBlockController(
    polygonZkEvmClient,
    blockAppraiser,
    config,
    database,
    logger.for(loggerContext),
  );

  const polygonZkEvmBlockControllerTask = new TaskScheduler(
    () => polygonZkEvmBlockController.start(),
    config.polygonZkEvmModule.pollIntervalMs,
    logger.for(loggerContext),
  );

  if (config.polygonZkEvmModule.enabled) {
    return {
      start: async () => {
        logger.info("Starting PolygonZkEVM block module...");
        polygonZkEvmBlockControllerTask.start();
      },
    };
  } else {
    logger.warn("PolygonZkEVM blocks module is disabled");
    return {
      start: async () => {},
    };
  }
}
