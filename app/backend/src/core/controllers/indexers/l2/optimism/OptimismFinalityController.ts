import Logger from "@/tools/Logger";
import OptimismClient from "@/core/clients/blockchain/optimism/OptimismClient";
import { Database } from "@/database/Database";
import { OptimismSyncStatus } from "@/core/clients/blockchain/optimism/types";
import SyncStatusRepository, {
  SyncStatusRecord,
} from "@/database/repositories/SyncStatusRepository";
import { Config } from "@/config";
import { SubmissionType } from "@/shared/api/viewModels/SyncStatusEndpoint";

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
        await this.processUpdate(currentStatus, SubmissionType.DataSubmission);
      }

      if (this.hasFinalizedL2Changed(currentStatus)) {
        await this.processUpdate(currentStatus, SubmissionType.L2Finalization);
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

  private hasFinalizedL2Changed(currentStatus: OptimismSyncStatus): boolean {
    return (
      this.previousStatus?.finalized_l2.number !==
      currentStatus.finalized_l2.number
    );
  }

  private async processUpdate(
    currentStatus: OptimismSyncStatus,
    submissionType: SubmissionType,
  ): Promise<void> {
    if (!this.previousStatus) {
      return;
    }
    const l2 =
      submissionType === SubmissionType.DataSubmission
        ? currentStatus.safe_l2
        : currentStatus.finalized_l2;

    const syncStatus: SyncStatusRecord = {
      chain_id: this.config.optimismModule.chainId,
      l2_block_number: BigInt(l2.number),
      l2_block_hash: l2.hash,
      l1_block_number: l2.l1origin.number,
      l1_block_hash: l2.l1origin.hash,
      timestamp: new Date(l2.timestamp * 1000),
      submission_type: submissionType,
    };

    await this.syncStatusRepository.insertSyncStatus(syncStatus);
  }
}

export default OptimismFinalityController;
