import {
  ApiConfig,
  Config,
  DatabaseConfig,
  EthereumMonitorConfig,
  IndexerConfig,
} from "./Config";
import { Env } from "../tools/Env";

export function getTestConfig(env: Env): Config {
  const databaseConfig: DatabaseConfig = {
    client: "pg",
    connection: env.string(
      "DB_URI",
      "postgresql://postgres:postgres@localhost:5432/postgres",
    ),
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
    ethereumRpcEndpoint: env.string(
      "ETHEREUM_RPC_ENDPOINT",
      "https://rpc.ankr.com/eth",
    ),
  };

  const ethereumMonitorConfig: EthereumMonitorConfig = {
    taskIntervalMs: env.integer("ETHEREUM_MONITOR_TASK_INTERVAL_MS", 1000),
    ethereumLogsStartBlock: env.integer("ETHEREUM_LOGS_START_BLOCK", 0),
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
