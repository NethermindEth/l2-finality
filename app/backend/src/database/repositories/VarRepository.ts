import { Knex } from "knex";
import { BlockValueRepository } from "@/database/repositories/BlockValueRepository";
import {
  AverageDetailsViewModel,
  AverageVarViewModel,
  BlockVarViewModel,
  SubmissionType,
  ValueType,
  VarByContractViewModel,
  VarByTypeViewModel,
} from "@/shared/api/viewModels/SyncStatusEndpoint";
import {
  ValueByContract,
  ValueByType,
  ValueMapping,
} from "@/core/controllers/appraiser/types";
import {
  SyncStatusRepository,
  TABLE_NAME as SYNC_TABLE_NAME,
} from "@/database/repositories/SyncStatusRepository";
import { whitelistedMap } from "@/core/clients/coingecko/assets/types";

export const TABLE_NAME = "var_status";

export interface VarStatusRecord {
  chain_id: number;
  timestamp: Date;
  last_l2_block_number: bigint;
  last_sync_at: Date;
  var_by_contract: ValueByContract;
  var_by_type: ValueByType;
  var_total_usd: number;
}

export interface BlockSyncStatus {
  l2_block_number: bigint;
  l2_block_at: Date;
  last_sync_at: Date;
  last_sync_block_number: bigint;
}

export class VarRepository {
  private readonly knex: Knex;
  private readonly blockRepository: BlockValueRepository;
  private readonly syncRepository: SyncStatusRepository;

  constructor(knex: Knex) {
    this.knex = knex;
    this.blockRepository = new BlockValueRepository(knex);
    this.syncRepository = new SyncStatusRepository(knex);
  }

  async insertVarStatus(status: VarStatusRecord): Promise<void> {
    await this.knex(TABLE_NAME)
      .insert(status)
      .onConflict(["chain_id", "timestamp"])
      .merge();
  }

  async getFirstVarStatus(
    chainId: number,
  ): Promise<VarStatusRecord | undefined> {
    const statuses = await this.knex(TABLE_NAME)
      .where("chain_id", chainId)
      .orderBy("timestamp", "asc")
      .limit(1)
      .select<VarStatusRecord[]>();

    return statuses[0];
  }

  async getLastVarStatus(
    chainId: number,
  ): Promise<VarStatusRecord | undefined> {
    const statuses = await this.knex(TABLE_NAME)
      .where("chain_id", chainId)
      .orderBy("timestamp", "desc")
      .limit(1)
      .select<VarStatusRecord[]>();

    return statuses[0];
  }

  getVarStatusBetween(
    chainId: number,
    from?: Date,
    to?: Date,
  ): Promise<VarStatusRecord[]> {
    let query = this.knex(TABLE_NAME)
      .where("chain_id", chainId)
      .orderBy("timestamp", "asc");

    if (from) query = query.where("timestamp", ">=", from);

    if (to) query = query.where("timestamp", "<=", to);

    return query.select<VarStatusRecord[]>();
  }

  async getLastBlockSyncStatus(
    chainId: number,
    before?: Date,
  ): Promise<BlockSyncStatus | undefined> {
    const lastBlock = await this.blockRepository.getLatestBlockNumber(
      chainId,
      before,
    );

    if (!lastBlock) return undefined;

    const lastSync = (
      await this.knex(SYNC_TABLE_NAME)
        .where("chain_id", chainId)
        .where(
          "submission_type",
          this.syncRepository.getDefaultSubmissionType(chainId),
        )
        .where("timestamp", "<=", lastBlock.l2_block_timestamp)
        .orderBy("timestamp", "desc")
        .limit(1)
        .select<{ l2_block_number: bigint; timestamp: Date }[]>({
          block: "l2_block_number",
          timestamp: "timestamp",
        })
    )[0];

    if (lastSync == undefined) return undefined;

    return {
      l2_block_number: lastBlock.l2_block_number,
      l2_block_at: lastBlock.l2_block_timestamp,
      last_sync_block_number: lastSync.l2_block_number,
      last_sync_at: lastSync.timestamp,
    };
  }

  async getVarHistory(
    chainId: number,
    from?: Date,
    to?: Date,
    precision?: number,
  ): Promise<BlockVarViewModel[]> {
    const result: BlockVarViewModel[] = [];

    precision ??= this.getDefaultPrecision(chainId);
    const type = this.syncRepository.getDefaultSubmissionType(chainId);
    from ??= await this.getDefaultFrom(chainId, type);
    if (!from) return result;

    const entries = await this.getVarStatusBetween(chainId, from, to);

    let lastEntryAt: Date | undefined = undefined;
    for (const entry of entries) {
      if (
        !lastEntryAt ||
        ((entry.timestamp.getTime() - lastEntryAt.getTime()) / 1000) * precision
      ) {
        lastEntryAt = entry.timestamp;
        result.push({
          block_number: Number(entry.last_l2_block_number),
          timestamp: entry.timestamp,
          by_contract: this.getVarByContractViewModels(
            chainId,
            entry.var_by_contract,
          ),
          by_type: this.getVarByTypeViewModels(entry.var_by_type),
        });
      }
    }

    return result;
  }

  async getVarAverage(
    chainId: number,
    from?: Date,
    to?: Date,
    precision?: number,
  ): Promise<AverageDetailsViewModel> {
    const result: AverageDetailsViewModel = {
      values: [],
      min_period_sec: 0,
      avg_period_sec: 0,
      max_period_sec: 0,
    };

    precision ??= this.getDefaultPrecision(chainId);
    const type = this.syncRepository.getDefaultSubmissionType(chainId);
    from ??= await this.getDefaultFrom(chainId, type);
    if (!from) return result;

    const entries = await this.getVarStatusBetween(chainId, from, to);

    if (entries.length == 0) return result;

    const varsMap = new Map<number, VarStatusRecord[]>();
    for (const entry of entries) {
      let diff = Math.floor(
        (entry.timestamp.getTime() - entry.last_sync_at.getTime()) / 1000,
      );

      if (!result.min_period_sec || diff < result.min_period_sec)
        result.min_period_sec = diff;
      if (!result.max_period_sec || diff > result.max_period_sec)
        result.max_period_sec = diff;
      result.avg_period_sec += diff;

      diff -= diff % precision;
      if (!varsMap.get(diff)) varsMap.set(diff, []);
      varsMap.get(diff)!.push(entry);
    }

    result.avg_period_sec /= entries.length;

    const times = Array.from(varsMap.keys());
    times.sort((a, b) => a - b);

    result.values = times.map((t) =>
      this.getAverageVarViewModel(chainId, t, varsMap.get(t)!),
    );

    return result;
  }

  private async getDefaultFrom(
    chainId: number,
    type: SubmissionType,
  ): Promise<Date | undefined> {
    const lastSync = await this.syncRepository.getLastSyncStatus(chainId, type);
    return lastSync?.timestamp;
  }

  private getAverageVarViewModel(
    chainId: number,
    time: number,
    values: VarStatusRecord[],
  ): AverageVarViewModel {
    const totals: ValueMapping = { byContract: {}, byType: {} };

    let minUsd = -1;
    let maxUsd = -1;

    for (const value of values) {
      const entryUsd = Number(value.var_total_usd);

      if (minUsd == -1 || entryUsd < minUsd) minUsd = entryUsd;
      if (maxUsd == -1 || entryUsd > maxUsd) maxUsd = entryUsd;

      if (value.var_by_contract) {
        for (const entry of Object.entries(value.var_by_contract)) {
          const [contract, val] = entry;

          const totalVar =
            totals.byContract![contract] ??
            (totals.byContract![contract] = { value_asset: 0, value_usd: 0 });

          totalVar.value_asset += val?.value_asset ?? 0;
          totalVar.value_usd += val?.value_usd ?? 0;
        }
      }

      if (value.var_by_type) {
        for (const entry of Object.entries(value.var_by_type)) {
          const type = entry[0] as ValueType;
          const val = entry[1];

          const totalVar =
            totals.byType![type] ??
            (totals.byType![type] = { value_asset: 0, value_usd: 0 });

          totalVar.value_asset += val?.value_asset ?? 0;
          totalVar.value_usd += val?.value_usd ?? 0;
        }
      }
    }

    for (const total of Object.values(totals.byContract!)) {
      total!.value_asset /= values.length;
      total!.value_usd /= values.length;
    }

    for (const total of Object.values(totals.byType!)) {
      total!.value_asset /= values.length;
      total!.value_usd /= values.length;
    }

    return {
      timestamp: time,
      min_var_usd: Math.max(minUsd, 0),
      max_var_usd: Math.max(maxUsd, 0),
      by_contract: this.getVarByContractViewModels(chainId, totals.byContract),
      by_type: this.getVarByTypeViewModels(totals.byType),
    };
  }

  private getVarByContractViewModels(
    chainId: number,
    value: ValueByContract | undefined,
  ): VarByContractViewModel[] {
    if (!value) return [];

    return Object.entries(value).map((x) => ({
      symbol: whitelistedMap.getSymbolByAddress(chainId, x[0]),
      address: x[0],
      var: x[1]?.value_asset ?? 0,
      var_usd: x[1]?.value_usd ?? 0,
    }));
  }

  private getVarByTypeViewModels(
    value: ValueByType | undefined,
  ): VarByTypeViewModel[] {
    if (!value) return [];

    return Object.entries(value).map((x) => ({
      type: x[0] as ValueType,
      var: x[1]?.value_asset,
      var_usd: x[1]?.value_usd,
    }));
  }

  private getDefaultPrecision = (chainId: number) => {
    if (chainId === 10) {
      return 6;
    } else if (chainId === 1101) {
      return 15;
    } else {
      return 300;
    }
  };
}

export default VarRepository;
