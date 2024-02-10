import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config/Config";
import OptimismClient from "@/core/clients/optimism/OptimismClient";
import OptimismFinalityController from "@/core/controllers/indexers/l2/optimism/OptimismFinalityController";

export function createOptimismFinalityModule(
  config: Config,
  logger: Logger,
  database: Database,
  optimismClient: OptimismClient,
): () => Promise<void> {
  const loggerContext = "Optimism Finality";

  const optimismFinalityController = new OptimismFinalityController(
    optimismClient,
    config,
    database,
    logger.for(loggerContext),
  );

  if (config.optimismModule.enabled) {
    return async () => {
      logger.info("Starting Optimism finality module...");
      await optimismFinalityController.start();
    };
  } else {
    logger.warn("Optimism finality module is disabled");
    return async () => {};
  }
}
