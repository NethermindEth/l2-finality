import { Knex } from "knex";
import { LogLevel } from "@/tools/Logger";

export interface Config {
  readonly database: DatabaseConfig;
  readonly api: ApiConfig;
  readonly indexers: IndexerConfig;
  readonly pricingModule: PricingModuleConfig;
  readonly ethereumMonitorModule: EthereumMonitorConfig;
  readonly optimismModule: OptimismModuleConfig;
  readonly varModule: VarModuleConfig;
  readonly polygonZkEvmModule: PolygonZkEvmModuleConfig;
  readonly starknetModule: StarknetModuleConfig;
}

export interface ApiConfig {
  readonly port: number;
  readonly logLevel: LogLevel;
  readonly httpsProxy: string | undefined;
  readonly apiKey: string;
}

export interface DatabaseConfig {
  readonly client: string;
  readonly connection: Knex.Config["connection"];
  readonly freshStart: boolean;
  readonly connectionPoolSize: {
    min: number;
    max: number;
  };
}

export interface IndexerConfig {
  readonly ethereumRpcEndpoint: string;
  readonly optimismRpcEndpoint: string;
  readonly polygonZkEvmRpcEndpoint: string;
  readonly starknetRpcEndpoint: string;
  readonly starknetApiKey?: string;
  readonly useFakePricing: boolean;
}

export interface PricingModuleConfig {
  readonly enabled: boolean;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly apiKeyHeader: string;
  readonly maxMinuteRateLimit: number;
  readonly backfillPeriodDays: number;
  readonly intervalMinutes: number;
}

export interface EthereumMonitorConfig {
  readonly enabled: boolean;
  readonly chainId: number;
  readonly ethereumLogsStartBlock: number;
  readonly maxBlockLogRange: number;
  readonly pollIntervalMs: number;
}

export interface OptimismModuleConfig {
  readonly enabled: boolean;
  readonly chainId: number;
  readonly startBlock: number;
  readonly maxBlockRange: number;
  readonly pollIntervalMs: number;
}

export interface PolygonZkEvmModuleConfig {
  readonly enabled: boolean;
  readonly chainId: number;
  readonly startBlock: number;
  readonly maxBlockRange: number;
  readonly pollIntervalMs: number;
}

export interface StarknetModuleConfig {
  readonly enabled: boolean;
  readonly chainId: number;
  readonly startBlock: number;
  readonly maxBlockRange: number;
  readonly pollIntervalMs: number;
}

export interface VarModuleConfig {
  readonly enabled: boolean;
  readonly backfillPeriodDays: number;
  readonly pollIntervalMs: number;
}
