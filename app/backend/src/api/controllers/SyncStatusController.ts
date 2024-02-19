import { SyncStatusRepository } from "@/database/repositories/SyncStatusRepository";
import Logger from "@/tools/Logger";
import { Request, Response } from "express";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "@/api/utils/responseUtils";
import { chainTableMapping } from "@/database/repositories/BlockValueRepository";

export class SyncStatusController {
  private syncStatusRepository: SyncStatusRepository;
  private logger: Logger;

  constructor(syncStatusRepository: SyncStatusRepository, logger: Logger) {
    this.syncStatusRepository = syncStatusRepository;
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

      const syncStatusRecords =
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
}
