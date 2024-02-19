import Logger from "@/tools/Logger";
import { Database } from "@/database/Database";
import CoinCapClient from "@/core/clients/coincap/CoinCapClient";
import { PriceUpdaterController } from "@/core/controllers/pricing/PriceUpdaterController";
import { PriceRepository } from "@/database/repositories/PricingRepository";
import TaskScheduler from "@/core/scheduler/TaskScheduler";
import { Config } from "@/config/Config";

export function createPriceUpdaterModule(
  config: Config,
  logger: Logger,
  database: Database,
  coinCapClient: CoinCapClient,
): { start: () => Promise<void> } {
  const loggerContext: string = "Price updater module";

  const priceRepository = new PriceRepository(database.getKnex());

  const priceUpdaterController = new PriceUpdaterController(
    coinCapClient,
    priceRepository,
    logger,
  );

  const priceUpdaterTaskScheduler = new TaskScheduler(
    () => priceUpdaterController.start(),
    10000,
    logger.for(loggerContext),
  );

  if (config.pricingModule.enabled) {
    return {
      start: async () => {
        logger.info("Starting price updater...");
        await priceUpdaterTaskScheduler.start();
      },
    };
  } else {
    logger.warn("Price updater is disabled");
    return {
      start: async () => {},
    };
  }
}
