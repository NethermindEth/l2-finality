import { Knex } from "knex";
import { BlockValueRepository } from "@/database/repositories/BlockValueRepository";
import {
  AverageDetailsViewModel,
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
import { VarModuleConfig } from "@/config/Config";
import chains from "@/shared/chains.json";

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

interface AggregateVarDto {
  min_var_usd: number;
  avg_var_usd: number;
  max_var_usd: number;
  by_contract: ValueByContract;
  by_type: ValueByType;
}

export class VarRepository {
  private readonly knex: Knex;
  private readonly blockRepository: BlockValueRepository;
  private readonly syncRepository: SyncStatusRepository;
  private readonly config: VarModuleConfig;

  constructor(knex: Knex, config: VarModuleConfig) {
    this.knex = knex;
    this.blockRepository = new BlockValueRepository(knex);
    this.syncRepository = new SyncStatusRepository(knex);
    this.config = config;
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

  async getOutdatedVarTimestamps(
    chainId: number,
    from?: Date,
    limit?: number,
  ): Promise<Date[]> {
    const type = this.syncRepository.getDefaultSubmissionType(chainId);

    let query = this.knex({ v: TABLE_NAME })
      .where("chain_id", chainId)
      .where(
        "last_sync_at",
        "!=",
        this.knex(SYNC_TABLE_NAME)
          .where("submission_type", type)
          .where("chain_id", chainId)
          .where("timestamp", "<=", this.knex.raw("v.timestamp"))
          .max("timestamp"),
      );

    if (from) query = query.where("timestamp", ">=", from);

    if (limit) query = query.limit(limit);

    const result = await query
      .orderBy("timestamp")
      .select<{ timestamp: Date }[]>("timestamp");

    return result.map((x) => x.timestamp);
  }

  async getVarAverage(
    chainId: number,
    from?: Date,
    to?: Date,
    precision?: number,
  ): Promise<AverageDetailsViewModel> {
    const result: AverageDetailsViewModel = {
      min_period_sec: 0,
      avg_period_sec: 0,
      max_period_sec: 0,
      timestamps: [],
      min_usd: [],
      avg_usd: [],
      max_usd: [],
      by_contract: {},
      by_type: {},
    };

    precision ??= this.getDefaultPrecision(chainId);
    precision = this.normalizePrecision(chainId, precision);

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

      diff = Math.round(diff / precision) * precision;
      if (!varsMap.get(diff)) varsMap.set(diff, []);
      varsMap.get(diff)!.push(entry);

      Object.keys(entry.var_by_contract).forEach((c) => {
        if (!result.by_contract[c]) result.by_contract[c] = [];
      });
    }

    result.avg_period_sec /= entries.length;

    for (const t of Object.keys(ValueType)) {
      result.by_type[t as ValueType] ??= [];
    }

    const times = Array.from(varsMap.keys());
    times.sort((a, b) => a - b);

    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const aggregate = this.aggregate(varsMap.get(time)!);

      result.timestamps.push(time);
      result.min_usd.push(aggregate.min_var_usd);
      result.avg_usd.push(aggregate.avg_var_usd);
      result.max_usd.push(aggregate.max_var_usd);

      for (const c of Object.keys(result.by_contract)) {
        result.by_contract[c]!.push(aggregate.by_contract[c]?.value_usd ?? 0);
      }

      for (const ts of Object.keys(ValueType)) {
        const t = ts as ValueType;
        result.by_type[t]!.push(aggregate.by_type[t]?.value_usd ?? 0);
      }
    }

    result.by_contract = Object.fromEntries(
      Object.entries(result.by_contract).map(([c, d]) => [
        whitelistedMap.getSymbolByAddress(chainId, c),
        d,
      ]),
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

  private aggregate(values: VarStatusRecord[]): AggregateVarDto {
    const totals: ValueMapping = { byContract: {}, byType: {} };

    let minUsd = -1;
    let avgUsd = 0;
    let maxUsd = -1;

    for (const value of values) {
      const entryUsd = Number(value.var_total_usd);

      if (minUsd == -1 || entryUsd < minUsd) minUsd = entryUsd;
      if (maxUsd == -1 || entryUsd > maxUsd) maxUsd = entryUsd;
      avgUsd += entryUsd;

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

    avgUsd /= values.length;

    return {
      by_contract: totals.byContract!,
      by_type: totals.byType!,
      min_var_usd: minUsd,
      avg_var_usd: avgUsd,
      max_var_usd: maxUsd,
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
    if (chainId === chains.Optimism.chainId) {
      return 6;
    } else if (chainId === chains.zkEVM.chainId) {
      return 15;
    } else if (chainId === chains.Starknet.chainId) {
      return 300;
    } else {
      return 60;
    }
  };

  private normalizePrecision = (chainId: number, precision: number) => {
    const minPrecision = Math.floor(this.config.pollIntervalMs / 1000);
    precision = Math.max(precision, minPrecision);
    if (chainId == chains.Starknet.chainId)
      precision = Math.max(precision, 900);
    return precision;
  };
}

export default VarRepository;
