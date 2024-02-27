import Logger from "@/tools/Logger";
import { Database } from "@/database/Database";
import { PriceUpdaterController } from "@/core/controllers/pricing/PriceUpdaterController";
import { PriceRepository } from "@/database/repositories/PricingRepository";
import { Config } from "@/config/Config";
import { CoinGeckoClient } from "@/core/clients/coingecko/CoinGeckoClient";
import { Clock } from "@/tools/Clock";

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
    logger.for(loggerContext),
  );

  const priceUpdaterClock = new Clock(
    () => priceUpdaterController.start(),
    config.pricingModule.intervalMinutes,
  );

  if (config.pricingModule.enabled) {
    return {
      start: async () => {
        logger.info("Starting price updater...");

        // Run in background to not stop spot prices from updating
        setImmediate(() =>
          priceUpdaterController.backfillHistory(
            config.pricingModule.backfillPeriodDays,
          ),
        );

        priceUpdaterClock.start();
      },
    };
  } else {
    logger.warn("Price updater is disabled");
    return {
      start: async () => {},
    };
  }
}
