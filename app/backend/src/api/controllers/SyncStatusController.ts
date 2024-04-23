import {
  GroupRange,
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
import { VarRepository } from "@/database/repositories/VarRepository";

export class SyncStatusController {
  private readonly syncStatusRepository: SyncStatusRepository;
  private readonly varRepository: VarRepository;
  private readonly logger: Logger;

  constructor(
    syncStatusRepository: SyncStatusRepository,
    varRepository: VarRepository,
    logger: Logger,
  ) {
    this.syncStatusRepository = syncStatusRepository;
    this.varRepository = varRepository;
    this.logger = logger;
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

  async getVarHistory(req: Request, res: Response): Promise<void> {
    try {
      const params = this.extractParams(req, res);
      if (!params) return;

      const result = await this.syncStatusRepository.getVarHistory(
        params.chainId,
        undefined,
        params.from,
        params.to,
        params.precision,
      );

      sendSuccessResponse(res, result);
    } catch (error) {
      this.logger.error("Error getting VaR history:", error);
      sendErrorResponse(res, 500, "Internal error getting VaR history");
    }
  }

  async getVarAverage(req: Request, res: Response): Promise<void> {
    try {
      const params = this.extractParams(req, res);
      if (!params) return;

      const result = await this.varRepository.getVarAverage(
        params.chainId,
        params.from,
        params.to,
        params.precision,
      );

      sendSuccessResponse(res, result);
    } catch (error) {
      this.logger.error("Error getting VaR average:", error);
      sendErrorResponse(res, 500, "Internal error getting VaR average");
    }
  }

  extractParams(
    req: Request,
    res: Response,
  ):
    | {
        chainId: number;
        groupRange: GroupRange;
        from?: Date;
        to?: Date;
        precision?: number;
      }
    | undefined {
    const chainId: number = parseInt(req.query.chainId as string);
    const groupRange: GroupRange = (req.query.range as GroupRange) || "day";
    const from: Date | undefined = req.query.from
      ? new Date(req.query.from as string)
      : undefined;
    const to: Date | undefined = req.query.to
      ? new Date(req.query.to as string)
      : undefined;
    const precision: number | undefined = req.query.precision
      ? parseInt(req.query.precision as string)
      : undefined;

    if (!Object.keys(chainTableMapping).includes(chainId.toString())) {
      sendErrorResponse(res, 400, "Invalid chain ID");
      return;
    }

    return { chainId, groupRange, from, to, precision };
  }
}
