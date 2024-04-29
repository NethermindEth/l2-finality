import Logger from "@/tools/Logger";
import { Database } from "@/database/Database";
import VarRepository, {
  BlockSyncStatus,
  VarStatusRecord,
} from "@/database/repositories/VarRepository";
import BlockValueRepository from "@/database/repositories/BlockValueRepository";
import {
  mergeBlockValues,
  ValueMapping,
} from "@/core/controllers/appraiser/types";
import { VarModuleConfig } from "@/config/Config";
import { ValueType } from "@/shared/api/viewModels/SyncStatusEndpoint";

class VarUpdaterController {
  private readonly logger: Logger;
  private readonly config: VarModuleConfig;
  private readonly database: Database;
  private readonly varRepository: VarRepository;
  private readonly blockRepository: BlockValueRepository;

  private readonly chainId: number;

  constructor(
    config: VarModuleConfig,
    database: Database,
    logger: Logger,
    chainId: number,
  ) {
    this.logger = logger;
    this.config = config;
    this.database = database;

    this.varRepository = new VarRepository(
      this.database.getKnex(),
      this.config,
    );
    this.blockRepository = new BlockValueRepository(this.database.getKnex());

    this.chainId = chainId;
  }

  public async start(): Promise<void> {
    const newVar = await this.updateLastVar();

    if (newVar) {
      const logDetails = {
        timestamp: newVar.timestamp,
        blockNumber: newVar.last_l2_block_number,
        syncedAt: newVar.last_sync_at,
        totalUsd: newVar.var_total_usd,
      };

      this.logger.info(`Updated latest VaR: ${JSON.stringify(logDetails)}`);
    }

    await this.fixHistory();
  }

  public async backfill(): Promise<void> {
    const [startTime, endTime] = this.getBackfillStartEnd();

    let timestamp: Date | undefined =
      (await this.varRepository.getFirstVarStatus(this.chainId))?.timestamp ??
      new Date();

    while (timestamp && timestamp > endTime) {
      timestamp = new Date(timestamp.getTime() - this.config.pollIntervalMs);
      const newVar = await this.updateVarAt(timestamp);
      timestamp = newVar?.timestamp;
    }

    const duration = Math.round(
      (new Date().getTime() - startTime.getTime()) / 1000,
    );
    this.logger.info(`Backfilled VaR history in ${duration}s`);
  }

  private async fixHistory() {
    const [startTime, endTime] = this.getBackfillStartEnd();
    const fixTimes = await this.varRepository.getOutdatedVarTimestamps(
      this.chainId,
      endTime,
      100,
    );

    if (!fixTimes.length) return;

    this.logger.warn(`Found ${fixTimes.length} outdated VaR entries`);

    for (const time of fixTimes) await this.updateVarAt(time);

    const duration = Math.round(
      (new Date().getTime() - startTime.getTime()) / 1000,
    );
    this.logger.info(
      `Fixed ${fixTimes.length} outdated VaR entries in ${duration}s`,
    );
  }

  private async updateLastVar(): Promise<VarStatusRecord | undefined> {
    const lastVar = await this.varRepository.getLastVarStatus(this.chainId);
    const lastBlock = await this.varRepository.getLastBlockSyncStatus(
      this.chainId,
    );

    if (lastBlock == undefined) return undefined;

    if (
      lastVar != undefined &&
      lastVar.last_sync_at >= lastBlock.last_sync_at &&
      lastVar.last_l2_block_number >= lastBlock.l2_block_number
    )
      return undefined;

    return await this.updateVarAtBlock(lastBlock);
  }

  private async updateVarAt(
    timestamp: Date,
  ): Promise<VarStatusRecord | undefined> {
    const lastBlock = await this.varRepository.getLastBlockSyncStatus(
      this.chainId,
      timestamp,
    );

    if (lastBlock == undefined) return undefined;

    return await this.updateVarAtBlock(lastBlock);
  }

  private async updateVarAtBlock(
    block: BlockSyncStatus,
  ): Promise<VarStatusRecord> {
    const blocks = await this.blockRepository.getBetweenTimestamps(
      this.chainId,
      block.last_sync_at,
      block.l2_block_at,
    );

    const value = blocks ? mergeBlockValues(blocks, true) : {};

    const newVar: VarStatusRecord = {
      chain_id: this.chainId,
      timestamp: block.l2_block_at,
      last_l2_block_number: block.l2_block_number,
      last_sync_at: block.last_sync_at,
      var_by_type: value.byType ?? {},
      var_by_contract: value.byContract ?? {},
      var_total_usd: this.getTotalUsd(value),
    };

    await this.varRepository.insertVarStatus(newVar);
    return newVar;
  }

  private getBackfillStartEnd(): [Date, Date] {
    const dayMs = 24 * 60 * 60 * 1000;
    const from = new Date();

    let to = new Date(from.getTime());
    to.setUTCHours(0, 0, 0, 0);
    to = new Date(to.getTime() - dayMs * this.config.backfillPeriodDays);

    return [from, to];
  }

  private getTotalUsd(value: ValueMapping): number {
    let total = 0;

    if (!value.byType) return total;

    for (const entry of Object.entries(value.byType)) {
      const type = entry[0] as any as ValueType;
      const val = entry[1];

      if (type == ValueType.block_reward) continue;

      total += val.value_usd;
    }

    return total;
  }
}

export default VarUpdaterController;
