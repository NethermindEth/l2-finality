import {
  GroupRange,
  SubmissionType,
  SyncStatusRecord,
  SyncStatusRepository,
} from "@/database/repositories/SyncStatusRepository";
import Logger from "@/tools/Logger";
import { Request, Response } from "express";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "@/api/utils/responseUtils";
import { chainTableMapping } from "@/database/repositories/BlockValueRepository";
import whitelisted from "@/core/clients/coingecko/assets/whitelisted.json";
import { ethers } from "ethers";

interface AssetMap {
  [chainId: number]: {
    [address: string]: string;
  };
}

export class SyncStatusController {
  private syncStatusRepository: SyncStatusRepository;
  private logger: Logger;
  private readonly assetMap: AssetMap;

  constructor(syncStatusRepository: SyncStatusRepository, logger: Logger) {
    this.syncStatusRepository = syncStatusRepository;
    this.logger = logger;

    this.assetMap = {};
    for (const asset of whitelisted) {
      if (!asset.address) continue;
      this.assetMap[asset.chainId] ??= {
        ["0x0000000000000000000000000000000000000000"]: "ETH",
      };
      this.assetMap[asset.chainId][asset.address] = asset.symbol;
    }
  }

  async getPaginatedByChain(req: Request, res: Response): Promise<void> {
    try {
      const chainId: number = parseInt(req.query.chainId as string);
      const page: number = parseInt(req.query.page as string) || 1;
      const pageSize: number = parseInt(req.query.pageSize as string) || 10;

      if (!Object.keys(chainTableMapping).includes(chainId.toString())) {
        sendErrorResponse(res, 400, "Invalid chain ID");
        return;
      }

      const syncStatusRecords: SyncStatusRecord[] =
        await this.syncStatusRepository.getPaginatedSyncStatus(
          chainId,
          page,
          pageSize,
        );
      if (syncStatusRecords.length > 0) {
        sendSuccessResponse(res, syncStatusRecords);
      } else {
        sendErrorResponse(res, 404, "No records found");
      }
    } catch (error) {
      this.logger.error("Error sync status:", error);
      sendErrorResponse(res, 500, "Internal error getting metadata");
    }
  }

  async getAverageSubmissionInterval(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const params = this.extractParams(req, res);
      if (!params) return;

      const diffs =
        await this.syncStatusRepository.getAverageSubmissionInterval(
          params.chainId,
          params.groupRange,
          params.from,
          params.to,
        );

      sendSuccessResponse(res, Object.fromEntries(diffs));
    } catch (error) {
      this.logger.error("Error getting average submission interval:", error);
      sendErrorResponse(res, 500, "Internal error getting interval");
    }
  }

  async getAverageVarHistory(req: Request, res: Response): Promise<void> {
    try {
      const params = this.extractParams(req, res);
      if (!params) return;

      const vars = await this.syncStatusRepository.getAverageValueAtRiskHistory(
        params.chainId,
        params.groupRange,
        params.from,
        params.to,
      );

      if (params.useNames) this.replaceAddressesWithNames(vars, params.chainId);

      sendSuccessResponse(res, vars);
    } catch (error) {
      this.logger.error("Error getting average VaR history:", error);
      sendErrorResponse(res, 500, "Internal error getting average VaR history");
    }
  }

  async getActiveVar(req: Request, res: Response): Promise<void> {
    try {
      const params = this.extractParams(req, res);
      if (!params) return;

      const vars = await this.syncStatusRepository.getActiveValueAtRisk(
        params.chainId,
      );

      if (params.useNames) this.replaceAddressesWithNames(vars, params.chainId);

      sendSuccessResponse(res, vars);
    } catch (error) {
      this.logger.error("Error getting active VaR:", error);
      sendErrorResponse(res, 500, "Internal error getting active VaR");
    }
  }

  extractParams(
    req: Request,
    res: Response,
  ):
    | {
        chainId: number;
        groupRange: GroupRange;
        useNames: boolean;
        from?: Date;
        to?: Date;
      }
    | undefined {
    const chainId: number = parseInt(req.query.chainId as string);
    const groupRange: GroupRange = (req.query.range as GroupRange) || "day";
    const useNames: boolean = req.query.useNames === "true";
    const from: Date | undefined = req.query.from
      ? new Date(req.query.from as string)
      : undefined;
    const to: Date | undefined = req.query.to
      ? new Date(req.query.to as string)
      : undefined;

    if (!Object.keys(chainTableMapping).includes(chainId.toString())) {
      sendErrorResponse(res, 400, "Invalid chain ID");
      return;
    }

    return { chainId, groupRange, useNames, from, to };
  }

  replaceAddressesWithNames<T>(
    map: { [sub in SubmissionType]: { [address: string]: T } },
    chainId: number,
  ) {
    for (const entries of Object.values(map)) {
      for (const address of Object.keys(entries)) {
        const assetChainMap = this.assetMap[chainId];
        const symbol =
          assetChainMap && assetChainMap[ethers.getAddress(address)];
        if (symbol) {
          entries[symbol] = entries[address];
          delete entries[address];
        }
      }
    }
  }
}
