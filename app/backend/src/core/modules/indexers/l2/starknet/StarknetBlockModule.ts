import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config/Config";
import { TaskScheduler } from "@/core/scheduler/TaskScheduler";
import { createBlockAppraiser } from "@/core/controllers/appraiser/getAppraiser";
import StarknetBlockController from "@/core/controllers/indexers/l2/starknet/StarknetBlockController";
import StarknetClient from "@/core/clients/blockchain/starknet/StarknetClient";

export function createStarknetBlockModule(
  config: Config,
  logger: Logger,
  database: Database,
  starknetClient: StarknetClient,
): { start: () => Promise<void> } {
  const loggerContext = "Starknet Blocks";

  const blockAppraiser = createBlockAppraiser(
    starknetClient,
    config,
    logger.for("Stark Appraiser"),
    database,
  );

  const starknetBlockController = new StarknetBlockController(
    starknetClient,
    blockAppraiser,
    config,
    database,
    logger.for(loggerContext),
  );

  const starknetBlockControllerTask = new TaskScheduler(
    () => starknetBlockController.start(),
    config.starknetModule.pollIntervalMs,
    logger.for(loggerContext),
  );

  if (config.starknetModule.enabled) {
    return {
      start: async () => {
        logger.info("Starting Starknet block module...");
        starknetBlockControllerTask.start();
      },
    };
  } else {
    logger.warn("Starknet blocks module is disabled");
    return {
      start: async () => {},
    };
  }
}
