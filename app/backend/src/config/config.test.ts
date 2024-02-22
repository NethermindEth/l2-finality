import {
  ApiConfig,
  Config,
  DatabaseConfig,
  EthereumMonitorConfig,
  IndexerConfig,
  OptimismModuleConfig,
  PricingModuleConfig,
} from "./Config";
import { Env } from "@/tools/Env";
import { LogLevel } from "@/tools/Logger";

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
    logLevel: env.string("LOG_LEVEL", "debug") as LogLevel
  };

  const indexerConfig: IndexerConfig = {
    ethereumRpcEndpoint: env.string(
      "ETHEREUM_RPC_ENDPOINT",
      "https://rpc.ankr.com/eth",
    ),
    optimismRpcEndpoint: env.string(
      "OPTIMISM_RPC_ENDPOINT",
      "https://rpc.ankr.com/optimism",
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

  const ethereumMonitorConfig: EthereumMonitorConfig = {
    enabled: env.boolean("ETHEREUM_MONITOR_MODULE_ENABLED", true),
    chainId: 1,
    pollIntervalMs: env.integer("ETHEREUM_MONITOR_POLL_INTERVAL_MS", 30000),
    ethereumLogsStartBlock: env.integer("ETHEREUM_MONITOR_START_BLOCK", 0),
    maxBlockLogRange: env.integer("ETHEREUM_MONITOR_MAX_LOG_RANGE", 5),
  };

  const optimismModuleConfig: OptimismModuleConfig = {
    enabled: env.boolean("OPTIMISM_MODULE_ENABLED", true),
    chainId: 10,
    startBlock: env.integer("OPTIMISM_START_BLOCK", 0),
    maxBlockRange: env.integer("OPTIMISM_MAX_BLOCK_RANGE", 50),
    pollIntervalMs: env.integer("OPTIMISM_POLL_INTERVAL_MS", 15000),
  };

  return {
    database: databaseConfig,
    api: apiConfig,
    indexers: indexerConfig,
    pricingModule: pricingModuleConfig,
    ethereumMonitorModule: ethereumMonitorConfig,
    optimismModule: optimismModuleConfig,
  };
}
