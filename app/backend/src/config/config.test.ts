import {
  ApiConfig,
  Config,
  DatabaseConfig,
  EthereumMonitorConfig,
  IndexerConfig,
  OptimismModuleConfig,
  PolygonZkEvmModuleConfig,
  PricingModuleConfig,
  StarknetModuleConfig,
} from "./Config";
import { Env } from "@/tools/Env";
import { LogLevel } from "@/tools/Logger";
import chains from "@/core/types/chains.json";

export function getTestConfig(env: Env): Config {
  const databaseConfig: DatabaseConfig = {
    client: "pg",
    connection: env.string(
      "TEST_DB_URI",
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
    logLevel: env.string("LOG_LEVEL", "debug") as LogLevel,
    httpsProxy: env.optionalString("HTTPS_PROXY"),
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
    polygonZkEvmRpcEndpoint: env.string(
      "POLYGONZK_RPC_ENDPOINT",
      "https://polygon-zkevm.drpc.org",
    ),
    starknetRpcEndpoint: env.string(
      "STARKNET_RPC_ENDPOINT",
      "https://rpc.nethermind.io/mainnet-juno",
    ),
    starknetApiKey: env.optionalString("STARKNET_RPC_API_KEY"),
    useFakePricing: env.boolean("USE_FAKE_APPRAISER_PRICES", false),
  };

  const pricingModuleConfig: PricingModuleConfig = {
    enabled: env.boolean("PRICING_MODULE_ENABLED", true),
    baseUrl: env.string("PRICING_BASE_URL", "https://api.coingecko.com/api/v3"),
    apiKey: env.string("PRICING_API_KEY", "coinGeckoApiKey"),
    apiKeyHeader: env.string("PRICING_API_KEY_HEADER", "x-cg-demo-api-key"),
    maxMinuteRateLimit: env.integer("PRICING_MINUTE_RATE_LIMIT", 100),
    backfillPeriodDays: env.integer("PRICING_BACKFILL_PERIOD_DAYS", 30),
    intervalMinutes: env.integer("PRICING_INTERVAL_MINUTES", 15),
  };

  const ethereumMonitorConfig: EthereumMonitorConfig = {
    enabled: env.boolean("ETHEREUM_MONITOR_MODULE_ENABLED", true),
    chainId: chains.Ethereum.chainId,
    pollIntervalMs: env.integer("ETHEREUM_MONITOR_POLL_INTERVAL_MS", 30000),
    ethereumLogsStartBlock: env.integer("ETHEREUM_MONITOR_START_BLOCK", 0),
    maxBlockLogRange: env.integer("ETHEREUM_MONITOR_MAX_LOG_RANGE", 5),
  };

  const optimismModuleConfig: OptimismModuleConfig = {
    enabled: env.boolean("OPTIMISM_MODULE_ENABLED", true),
    chainId: chains.Optimism.chainId,
    startBlock: env.integer("OPTIMISM_START_BLOCK", 0),
    maxBlockRange: env.integer("OPTIMISM_MAX_BLOCK_RANGE", 50),
    pollIntervalMs: env.integer("OPTIMISM_POLL_INTERVAL_MS", 15000),
  };

  const polygonZkEvmModuleConfig: PolygonZkEvmModuleConfig = {
    enabled: env.boolean("POLYGONZK_MODULE_ENABLED", true),
    chainId: chains.zkEVM.chainId,
    startBlock: env.integer("POLYGONZK_START_BLOCK", 10290000),
    maxBlockRange: env.integer("POLYGONZK_MAX_BLOCK_RANGE", 50),
    pollIntervalMs: env.integer("POLYGONZK_POLL_INTERVAL_MS", 15000),
  };

  const starknetModuleConfig: StarknetModuleConfig = {
    enabled: env.boolean("STARKNET_MODULE_ENABLED", true),
    chainId: chains.Starknet.chainId,
    startBlock: env.integer("STARKNET_START_BLOCK", 600365),
    maxBlockRange: env.integer("STARKNET_MAX_BLOCK_RANGE", 50),
    pollIntervalMs: env.integer("STARKNET_POLL_INTERVAL_MS", 60000),
  };

  return {
    database: databaseConfig,
    api: apiConfig,
    indexers: indexerConfig,
    pricingModule: pricingModuleConfig,
    ethereumMonitorModule: ethereumMonitorConfig,
    optimismModule: optimismModuleConfig,
    polygonZkEvmModule: polygonZkEvmModuleConfig,
    starknetModule: starknetModuleConfig,
  };
}
