import {
  ApiConfig,
  Config,
  DatabaseConfig,
  EthereumMonitorConfig,
  IndexerConfig,
} from "./Config";
import { Env } from "../tools/Env";

export function getLocalConfig(env: Env): Config {
  const databaseConfig: DatabaseConfig = {
    client: "pg",
    connection: env.string("DB_URI"),
    freshStart: env.boolean("DB_FRESH_START", true),
    connectionPoolSize: {
      min: 2,
      max: 10,
    },
  };

  const apiConfig: ApiConfig = {
    port: env.integer("API_PORT", 3005),
  };

  const indexerConfig: IndexerConfig = {
    ethereumRpcEndpoint: env.string("ETHEREUM_RPC_ENDPOINT"),
  };

  const ethereumMonitorConfig: EthereumMonitorConfig = {
    taskIntervalMs: env.integer("ETHEREUM_MONITOR_TASK_INTERVAL_MS", 1000),
    ethereumLogsStartBlock: env.integer("ETHEREUM_LOGS_START_BLOCK"),
    maxBlocksPerLogFetch: env.integer(
      "ETHEREUM_LOGS_MAX_BLOCKS_PER_LOG_FETCH",
      5,
    ),
  };

  return {
    database: databaseConfig,
    api: apiConfig,
    indexer: indexerConfig,
    ethereumMonitor: ethereumMonitorConfig,
  };
}
