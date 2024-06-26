import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config/Config";
import L1LogMonitorController from "@/core/controllers/indexers/l1/L1LogMonitorController";
import { TaskScheduler } from "@/core/scheduler/TaskScheduler";
import EthereumClient from "@/core/clients/blockchain/ethereum/EthereumClient";
import PolygonZkEvmClient from "@/core/clients/blockchain/polygonzk/PolygonZkEvmClient";
import LogProcessors from "@/core/controllers/indexers/l1/LogProcessor";

export function createL1MonitorModule(
  config: Config,
  logger: Logger,
  database: Database,
  ethClient: EthereumClient,
  polygonZkEvmClient: PolygonZkEvmClient,
): { start: () => Promise<void> } {
  const loggerContext = "L1 Log Monitor Module";
  const l1Processor = new LogProcessors(
    ethClient,
    polygonZkEvmClient,
    logger.for("Log Processor"),
  );

  const l1LogMonitor = new L1LogMonitorController(
    l1Processor,
    ethClient,
    config.ethereumMonitorModule,
    database,
    logger.for(loggerContext),
  );

  const l1LogMonitorTaskScheduler = new TaskScheduler(
    () => l1LogMonitor.start(),
    config.ethereumMonitorModule.pollIntervalMs,
    logger.for(loggerContext),
  );

  if (config.ethereumMonitorModule.enabled) {
    return {
      start: async () => {
        logger.info("Starting L1 monitor...");
        await l1LogMonitorTaskScheduler.start();
      },
    };
  } else {
    logger.warn("L1 monitor is disabled");
    return {
      start: async () => {},
    };
  }
}
