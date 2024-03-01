import Logger from "./tools/Logger";
import { Api } from "./api/Api";
import { Database } from "./database/Database";
import { Config } from "./config/Config";
import { createL1MonitorModule } from "./core/modules/indexers/l1/L1LogMonitorModule";
import EthereumClient from "@/core/clients/blockchain/ethereum/EthereumClient";
import { CoinGeckoClient } from "@/core/clients/coingecko/CoinGeckoClient";
import { createOptimismFinalityModule } from "./core/modules/indexers/l2/optimism/OptimismFinalityModule";
import OptimismClient from "@/core/clients/blockchain/optimism/OptimismClient";
import { createOptimismBlockModule } from "./core/modules/indexers/l2/optimism/OptimismBlockModule";
import { createPolygonZkEvmBlockModule } from "@/core/modules/indexers/l2/polygonzk/PolygonZkEvmBlockModule";
import PolygonZkEvmClient from "@/core/clients/blockchain/polygonzk/PolygonZkEvmClient";
import { createPriceUpdaterModule } from "@/core/modules/pricing/PriceUpdaterModule";

export class Application {
  constructor(config: Config) {
    const logger: Logger = new Logger({ logLevel: config.api.logLevel });
    const database: Database = new Database(config.database, logger);

    const ethClient = new EthereumClient(config, logger.for("Ethereum Client"));
    const optimismClient = new OptimismClient(
      config,
      logger.for("Optimism Client"),
    );
    const polygonZkEvmClient = new PolygonZkEvmClient(
      config,
      logger.for("PolygonZkEvm Client"),
    );
    const pricingClient = new CoinGeckoClient(
      config,
      logger.for("CoinGecko Client"),
    );

    this.start = async (): Promise<void> => {
      logger.info("Starting application ...");
      if (config.database.freshStart) {
        await database.rollbackAll();
      }
      await database.migrateToLatest();

      const api: Api = new Api(config.api.port, logger, database);
      await api.listen();

      const modules = [
        createPriceUpdaterModule(config, logger, database, pricingClient),
        createOptimismFinalityModule(config, logger, database, optimismClient),
        createL1MonitorModule(
          config,
          logger,
          database,
          ethClient,
          polygonZkEvmClient,
        ),
        createOptimismBlockModule(config, logger, database, optimismClient),
        createPolygonZkEvmBlockModule(
          config,
          logger,
          database,
          polygonZkEvmClient,
        ),
      ];

      for (const module of modules) {
        await module.start();
      }
    };
  }

  start: () => Promise<void>;
}
