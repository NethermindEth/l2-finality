import Logger from "./tools/Logger";
import { Api } from "./api/Api";
import { Database } from "./database/Database";
import { Config } from "./config/Config";
import { createL1MonitorModule } from "./core/modules/indexers/l1/L1LogMonitorModule";
import EthereumClient from "./core/clients/ethereum/EthereumClient";
import { createPriceUpdaterModule } from "./core/modules/pricing/PriceUpdaterModule";
import { CoinCapClient } from "./core/clients/coincap/CoinCapClient";
import { createOptimismFinalityModule } from "./core/modules/indexers/l2/optimism/OptimismFinalityModule";
import OptimismClient from "./core/clients/optimism/OptimismClient";
import { createOptimismBlockModule } from "./core/modules/indexers/l2/optimism/OptimismBlockModule";

export class Application {
  constructor(config: Config) {
    const logger: Logger = new Logger();
    const database: Database = new Database(config.database, logger);

    const ethClient = new EthereumClient(config, logger.for("Ethereum Client"));
    const optimismClient = new OptimismClient(
      config,
      logger.for("Optimism Client"),
    );
    const coinCapClient = new CoinCapClient(
      config,
      logger.for("CoinCap Client"),
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
        createPriceUpdaterModule(config, logger, database, coinCapClient),
        createOptimismFinalityModule(config, logger, database, optimismClient),
        createL1MonitorModule(config, logger, database, ethClient),
        createOptimismBlockModule(config, logger, database, optimismClient),
      ];

      for (const module of modules) {
        await module.start();
      }
    };
  }

  start: () => Promise<void>;
}
