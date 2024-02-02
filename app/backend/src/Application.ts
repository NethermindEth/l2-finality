import Logger from "./tools/Logger";
import { Api } from "./api/Api";
import { Database } from "./database/Database";
import { Config } from "./config/Config";
import { createL1MonitorModule } from "./core/modules/indexers/l1/L1LogMonitorModule";
import EthereumClient from "./core/clients/ethereum/EthereumClient";

export class Application {
  constructor(config: Config) {
    const logger: Logger = new Logger();
    const database: Database = new Database(config.database, logger);

    const ethClient = new EthereumClient(config, logger.for("EthereumClient"));

    this.start = async (): Promise<void> => {
      logger.info("Starting application ...");

      if (config.database.freshStart) {
        await database.rollbackAll();
      }
      await database.migrateToLatest();

      const api: Api = new Api(config.api.port, logger, database);
      await api.listen();

      const modules = [
        createL1MonitorModule(config, logger, database, ethClient),
      ];

      for (const module of modules) {
        await module();
      }
    };
  }

  start: () => Promise<void>;
}
