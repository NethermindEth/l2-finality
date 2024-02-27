import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config/Config";
import { TaskScheduler } from "@/core/scheduler/TaskScheduler";
import OptimismClient from "@/core/clients/blockchain/optimism/OptimismClient";
import OptimismBlockController from "@/core/controllers/indexers/l2/optimism/OptimismBlockController";
import { createBlockAppraiser } from "@/core/controllers/appraiser/getAppraiser";

export function createOptimismBlockModule(
  config: Config,
  logger: Logger,
  database: Database,
  optimismClient: OptimismClient,
): { start: () => Promise<void> } {
  const loggerContext = "Optimism Blocks";

  const blockAppraiser = createBlockAppraiser(
    optimismClient,
    config,
    logger.for("OP Appraiser"),
    database,
  );
  const optimismBlockController = new OptimismBlockController(
    optimismClient,
    blockAppraiser,
    config,
    database,
    logger.for(loggerContext),
  );

  const optimismBlockControllerTask = new TaskScheduler(
    () => optimismBlockController.start(),
    config.optimismModule.pollIntervalMs,
    logger.for(loggerContext),
  );

  if (config.optimismModule.enabled) {
    return {
      start: async () => {
        logger.info("Starting Optimism block module...");
        optimismBlockControllerTask.start();
      },
    };
  } else {
    logger.warn("Optimism blocks module is disabled");
    return {
      start: async () => {},
    };
  }
}
