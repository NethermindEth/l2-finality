import { Knex } from "knex";

export interface Config {
  readonly database: DatabaseConfig;
  readonly api: ApiConfig;
  readonly indexer: IndexerConfig;
  readonly ethereumMonitor: EthereumMonitorConfig;
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
}

export interface EthereumMonitorConfig {
  readonly taskIntervalMs: number;
  readonly ethereumLogsStartBlock: number;
  readonly maxBlocksPerLogFetch: number;
}
