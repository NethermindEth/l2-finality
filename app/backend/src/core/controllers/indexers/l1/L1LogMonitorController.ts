import Logger from "@/tools/Logger";
import EthereumClient from "@/core/clients/blockchain/ethereum/EthereumClient";
import EthereumLogDecoder from "@/core/clients/blockchain/ethereum/EthereumLogDecoder";
import contracts from "@/core/clients/blockchain/ethereum/contracts/contracts.json";
import { ContractName } from "@/core/clients/blockchain/ethereum/contracts/types";
import { Database } from "@/database/Database";
import MetadataRepository, {
  MetadataJobName,
  MetadataMetricName,
  MetadataRecord,
} from "@/database/repositories/MetadataRepository";
import { EthereumMonitorConfig } from "@/config/Config";
import SyncStatusRepository from "@/database/repositories/SyncStatusRepository";
import { ethers } from "ethers";
import { LogProcessors } from "./LogProcessor";

class L1LogMonitorController {
  private logger: Logger;
  private schedulerConfig: EthereumMonitorConfig;
  private logProcessor: LogProcessors;
  private ethClient: EthereumClient;
  private database: Database;

  private metadataRepository: MetadataRepository;
  private syncStatusRepository: SyncStatusRepository;
  private logDecoder: EthereumLogDecoder;

  private readonly timeoutMs = 1000;

  constructor(
    logProcessor: LogProcessors,
    ethClient: EthereumClient,
    config: EthereumMonitorConfig,
    database: Database,
    logger: Logger,
  ) {
    this.logger = logger;
    this.schedulerConfig = config;
    this.logProcessor = logProcessor;
    this.ethClient = ethClient;
    this.database = database;

    this.metadataRepository = new MetadataRepository(this.database.getKnex());
    this.syncStatusRepository = new SyncStatusRepository(
      this.database.getKnex(),
    );
    this.logDecoder = new EthereumLogDecoder(
      this.logger.for("EthereumLogDecoder"),
    );
  }

  public async start(): Promise<void> {
    const currentHeight = await this.ethClient.getCurrentHeight();
    const fromBlock = await this.startFrom();

    const numberOfBatches = Math.ceil(
      (currentHeight - fromBlock + 1) / this.schedulerConfig.maxBlockLogRange,
    );

    if (numberOfBatches <= 0) return;

    this.logger.info(
      `Fetching Ethereum contract logs from ${fromBlock} to ${currentHeight} (${numberOfBatches} batches)`,
    );
    for (
      let startBlock = fromBlock, batch = 1;
      startBlock <= currentHeight;
      startBlock += this.schedulerConfig.maxBlockLogRange + 1, batch++
    ) {
      const endBlock = Math.min(
        startBlock + this.schedulerConfig.maxBlockLogRange,
        currentHeight,
      );
      await this.fetchLogs(startBlock, endBlock);
      await this.metadataRepository.setMetadata(
        MetadataJobName.L1FinalityModule,
        MetadataMetricName.LatestBlockNumber,
        endBlock,
      );
      await new Promise((resolve) => setTimeout(resolve, this.timeoutMs));
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

      for (const logObject of decodedLogs) {
        if (!logObject) {
          continue;
        }
        await this.processDecodedLogs(
          logObject.contractName as ContractName,
          logObject.eventName,
          logObject.log,
          logObject.decodedLogEvents,
        );
      }
    }
  }

  public async processDecodedLogs(
    contractName: ContractName,
    eventName: string,
    log: ethers.Log,
    decodedLogs: Record<string, any>,
  ): Promise<void> {
    const eventCallbacks = this.logProcessor.callbackMapping[contractName];
    if (eventCallbacks) {
      const eventCallback = eventCallbacks[eventName];
      if (eventCallback) {
        const syncStatusRecord = await eventCallback(log, decodedLogs);
        if (syncStatusRecord) {
          await this.syncStatusRepository.insertSyncStatus(syncStatusRecord);
        }
      } else {
        this.logger.error(
          `No callback function found for event "${eventName}" of contract "${contractName}"`,
        );
      }
    } else {
      this.logger.error(
        `No callback mapping found for contract "${contractName}"`,
      );
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
