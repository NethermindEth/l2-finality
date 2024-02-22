import Logger from "@/tools/Logger";
import { Database } from "@/database/Database";
import { PriceUpdaterController } from "@/core/controllers/pricing/PriceUpdaterController";
import { PriceRepository } from "@/database/repositories/PricingRepository";
import TaskScheduler from "@/core/scheduler/TaskScheduler";
import { Config } from "@/config/Config";
import { CoinGeckoClient } from "@/core/clients/coingecko/CoinGeckoClient";

export function createPriceUpdaterModule(
  config: Config,
  logger: Logger,
  database: Database,
  client: CoinGeckoClient,
): { start: () => Promise<void> } {
  const loggerContext: string = "Price updater module";

  const priceRepository = new PriceRepository(database.getKnex());

  const priceUpdaterController = new PriceUpdaterController(
    client,
    priceRepository,
    config.pricingModule,
    logger.for(loggerContext)
  );

  const priceUpdaterTaskScheduler = new TaskScheduler(
    () => priceUpdaterController.start(),
    config.pricingModule.pollIntervalMs,
    logger.for(loggerContext),
  );

  if (config.pricingModule.enabled) {
    return {
      start: async () => {
        logger.info("Starting price updater...");
        priceUpdaterTaskScheduler.start();
      },
    };
  } else {
    logger.warn("Price updater is disabled");
    return {
      start: async () => {},
    };
  }
}
