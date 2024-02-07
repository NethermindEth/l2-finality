import {
  ApiConfig,
  Config,
  DatabaseConfig,
  EthereumMonitorConfig,
  IndexerConfig,
  PricingModuleConfig,
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
    optimismRpcEndpoint: env.string(
      "OPTIMISM_RPC_ENDPOINT",
      "https://rpc.ankr.com/optimism",
    )
  };

  const ethereumMonitorConfig: EthereumMonitorConfig = {
    enabled: env.boolean("ETHEREUM_MONITOR_MODULE_ENABLED", true),
    taskIntervalMs: env.integer("ETHEREUM_MONITOR_TASK_INTERVAL_MS", 1000),
    ethereumLogsStartBlock: env.integer("ETHEREUM_LOGS_START_BLOCK", 0),
    maxBlocksPerLogFetch: env.integer(
      "ETHEREUM_LOGS_MAX_BLOCKS_PER_LOG_FETCH",
      5,
    ),
  };

  const pricingModuleConfig: PricingModuleConfig = {
    enabled: env.boolean("PRICING_MODULE_ENABLED", true),
    coinCapBaseUrl: env.string(
      "PRICING_COINCAP_BASE_URL",
      "https://api.coincap.io/v2",
    ),
    coinCapApiKey: env.string("PRICING_COINCAP_API_KEY", "coinCapApiKey"),
    maxMinuteRateLimit: env.integer("PRICING_MINUTE_RATE_LIMIT", 100),
  };

  return {
    database: databaseConfig,
    api: apiConfig,
    indexer: indexerConfig,
    ethereumMonitor: ethereumMonitorConfig,
    pricingModule: pricingModuleConfig,
  };
}
