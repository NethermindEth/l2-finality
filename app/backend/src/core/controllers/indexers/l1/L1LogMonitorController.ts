import Logger from "../../../../tools/Logger";
import EthereumClient from "../../../../core/clients/ethereum/EthereumClient";
import EthereumLogDecoder from "../../../clients/ethereum/EthereumLogDecoder";
import contracts from "../../../clients/ethereum/contracts/contracts.json";
import { ContractName } from "@/core/clients/ethereum/contracts/types";
import { Database } from "@/database/Database";
import MetadataRepository, {
  MetadataJobName,
  MetadataMetricName,
  MetadataRecord,
} from "../../../../database/repositories/MetadataRepository";
import { EthereumMonitorConfig } from "@/config/Config";

class L1LogMonitorController {
  private logger: Logger;
  private schedulerConfig: EthereumMonitorConfig;
  private ethClient: EthereumClient;
  private database: Database;

  private metadataRepository: MetadataRepository;
  private logDecoder: EthereumLogDecoder;

  private readonly timoutMs = 1000;

  constructor(
    ethClient: EthereumClient,
    config: EthereumMonitorConfig,
    database: Database,
    logger: Logger,
  ) {
    this.logger = logger;
    this.schedulerConfig = config;
    this.ethClient = ethClient;
    this.database = database;

    this.metadataRepository = new MetadataRepository(this.database.getKnex());
    this.logDecoder = new EthereumLogDecoder(
      this.logger.for("EthereumLogDecoder"),
    );
  }

  public async start(): Promise<void> {
    const currentHeight = await this.ethClient.getCurrentHeight();
    const fromBlock = await this.startFrom();

    const numberOfBatches = Math.ceil(
      (currentHeight - fromBlock + 1) /
        this.schedulerConfig.maxBlocksPerLogFetch,
    );

    this.logger.info(
      `Fetching Ethereum contract logs from block ${fromBlock} to block: ${currentHeight} in ${numberOfBatches} batch(es)`,
    );
    for (
      let startBlock = fromBlock, batch = 1;
      startBlock <= currentHeight;
      startBlock += this.schedulerConfig.maxBlocksPerLogFetch + 1, batch++
    ) {
      const endBlock = Math.min(
        startBlock + this.schedulerConfig.maxBlocksPerLogFetch,
        currentHeight,
      );
      await this.fetchLogs(startBlock, endBlock);
      await this.metadataRepository.setMetadata(
        MetadataJobName.L1FinalityModule,
        MetadataMetricName.LatestBlockNumber,
        endBlock,
      );
      await new Promise((resolve) => setTimeout(resolve, this.timoutMs));
    }
  }

  public async fetchLogs(fromBlock: number, toBlock: number): Promise<void> {
    const contractNames: ContractName[] = Object.keys(
      contracts,
    ) as ContractName[];

    for (const contractName of contractNames) {
      const logs = await this.ethClient.getContractLogs(
        contractName,
        fromBlock,
        toBlock,
      );
      const decodedLogs = await Promise.all(
        logs.map((log) => this.logDecoder.decodeLog(log, contractName)),
      );

      console.log(contractName, logs, decodedLogs);
    }
  }

  private async startFrom(): Promise<number> {
    const metadataRecord: MetadataRecord | null =
      await this.metadataRepository.getMetadata(
        MetadataJobName.L1FinalityModule,
        MetadataMetricName.LatestBlockNumber,
      );
    return (
      (metadataRecord && metadataRecord.value) ||
      this.schedulerConfig.ethereumLogsStartBlock
    );
  }
}

export default L1LogMonitorController;
