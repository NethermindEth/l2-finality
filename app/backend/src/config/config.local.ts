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
    logLevel: env.string("LOG_LEVEL", "info") as LogLevel
  };

  const indexerConfig: IndexerConfig = {
    ethereumRpcEndpoint: env.string("ETHEREUM_RPC_ENDPOINT"),
    optimismRpcEndpoint: env.string("OPTIMISM_RPC_ENDPOINT"),
  };

  const pricingModuleConfig: PricingModuleConfig = {
    enabled: env.boolean("PRICING_MODULE_ENABLED", true),
    baseUrl: env.string(
      "PRICING_BASE_URL",
      "https://api.coingecko.com/api/v3",
    ),
    apiKey: env.string("PRICING_API_KEY"),
    apiKeyHeader: env.string("PRICING_API_KEY_HEADER", "x-cg-demo-api-key"),
    maxMinuteRateLimit: env.integer("PRICING_MINUTE_RATE_LIMIT", 30),
    backfillPeriodDays: env.integer("PRICING_BACKFILL_PERIOD_DAYS", 30),
    pollIntervalMs: env.integer("PRICING_POLL_INTERVAL_MS", 15 * 60 * 1000),
  };

  const ethereumMonitorModuleConfig: EthereumMonitorConfig = {
    enabled: env.boolean("ETHEREUM_MONITOR_MODULE_ENABLED", true),
    chainId: 1,
    ethereumLogsStartBlock: env.integer("ETHEREUM_MONITOR_START_BLOCK"),
    maxBlockLogRange: env.integer("ETHEREUM_MONITOR_MAX_LOG_RANGE", 5),
    pollIntervalMs: env.integer("ETHEREUM_MONITOR_POLL_INTERVAL_MS", 30000),
  };

  const optimismModuleConfig: OptimismModuleConfig = {
    enabled: env.boolean("OPTIMISM_MODULE_ENABLED", true),
    chainId: 10,
    startBlock: env.integer("OPTIMISM_START_BLOCK"),
    maxBlockRange: env.integer("OPTIMISM_MAX_BLOCK_RANGE", 50),
    pollIntervalMs: env.integer("OPTIMISM_POLL_INTERVAL_MS", 15000),
  };

  return {
    database: databaseConfig,
    api: apiConfig,
    indexers: indexerConfig,
    pricingModule: pricingModuleConfig,
    ethereumMonitorModule: ethereumMonitorModuleConfig,
    optimismModule: optimismModuleConfig,
  };
}
