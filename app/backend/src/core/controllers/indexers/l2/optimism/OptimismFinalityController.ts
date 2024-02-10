import Logger from "../../../../../tools/Logger";
import OptimismClient from "@/core/clients/optimism/OptimismClient";
import { Database } from "../../../../../database/Database";
import { OptimismSyncStatus } from "../../../../clients/optimism/types";
import SyncStatusRepository, {
  SubmissionType,
  SyncStatusRecord,
} from "../../../../../database/repositories/SyncStatusRepository";
import { Config } from "@/config";

class OptimismFinalityController {
  private readonly optimismClient: OptimismClient;
  private readonly database: Database;
  private readonly config: Config;
  private readonly logger: Logger;

  private readonly syncStatusRepository: SyncStatusRepository;

  private previousStatus: OptimismSyncStatus | null = null;
  private readonly refreshIntervalMs = 10000;

  constructor(
    optimismClient: OptimismClient,
    config: Config,
    database: Database,
    logger: Logger,
  ) {
    this.optimismClient = optimismClient;
    this.config = config;
    this.database = database;
    this.logger = logger;

    this.syncStatusRepository = new SyncStatusRepository(
      this.database.getKnex(),
    );
  }

  public async start(): Promise<void> {
    await this.monitorSyncStatus();
  }

  private async monitorSyncStatus(): Promise<void> {
    try {
      const currentStatus = await this.optimismClient.getSyncStatus();

      if (this.hasSafeL2OriginNumberChanged(currentStatus)) {
        await this.processUpdate(currentStatus);
      }

      this.previousStatus = currentStatus;
    } catch (error) {
      this.logger.error("Error fetching Optimism Sync Status:", error);
    } finally {
      setTimeout(() => this.monitorSyncStatus(), this.refreshIntervalMs);
    }
  }

  private hasSafeL2OriginNumberChanged(
    currentStatus: OptimismSyncStatus,
  ): boolean {
    return (
      this.previousStatus?.safe_l2.l1origin.number !==
      currentStatus.safe_l2.l1origin.number
    );
  }

  private async processUpdate(
    currentStatus: OptimismSyncStatus,
  ): Promise<void> {
    if (!this.previousStatus) {
      return;
    }

    const syncStatus: SyncStatusRecord = {
      chain_id: this.config.optimismModule.chainId,
      l2_block_number: BigInt(currentStatus.safe_l2.number),
      l2_block_hash: currentStatus.safe_l2.hash,
      l1_block_number: currentStatus.safe_l2.l1origin.number,
      l1_block_hash: currentStatus.safe_l2.l1origin.hash,
      timestamp: new Date(currentStatus.safe_l2.timestamp * 1000),
      submission_type: SubmissionType.DataSubmission,
    };

    await this.syncStatusRepository.insertSyncStatus(syncStatus);
  }
}

export default OptimismFinalityController;
