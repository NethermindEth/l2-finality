import Logger from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config/Config";
import VarUpdaterController from "@/core/controllers/var/VarUpdaterController";
import chains from "@/shared/chains.json";
import TaskScheduler from "@/core/scheduler/TaskScheduler";

export function createVarUpdaterModule(
  config: Config,
  logger: Logger,
  database: Database,
): { start: () => Promise<void> } {
  if (!config.varModule.enabled) {
    return {
      start: async () => {},
    };
  }

  return {
    start: async () => {
      logger.info("Starting VaR updater module...");

      for (const chain in chains) {
        const chainId = (chains as any)[chain].chainId;
        if (chainId == 1) continue;

        const loggerContext = `${chain} VaR updater module`;
        const controller = new VarUpdaterController(
          config.varModule,
          database,
          logger.for(loggerContext),
          chainId,
        );

        const task = new TaskScheduler(
          () => controller.start(),
          config.varModule.pollIntervalMs,
          logger.for(loggerContext),
        );

        setImmediate(() => controller.backfill());
        task.start();
      }
    },
  };
}
