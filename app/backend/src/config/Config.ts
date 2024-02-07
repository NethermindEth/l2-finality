import { Knex } from "knex";

export interface Config {
  readonly database: DatabaseConfig;
  readonly api: ApiConfig;
  readonly indexer: IndexerConfig;
  readonly ethereumMonitor: EthereumMonitorConfig;
  readonly pricingModule: PricingModuleConfig;
}

export interface ApiConfig {
  readonly port: number;
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
}

export interface EthereumMonitorConfig {
  readonly enabled: boolean;
  readonly taskIntervalMs: number;
  readonly ethereumLogsStartBlock: number;
  readonly maxBlocksPerLogFetch: number;
}

export interface PricingModuleConfig {
  readonly enabled: boolean;
  readonly coinCapBaseUrl: string;
  readonly coinCapApiKey: string;
  readonly maxMinuteRateLimit: number;
}


