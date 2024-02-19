import { Request, Response } from "express";
import {
  BlockValueRepository,
  chainTableMapping,
} from "@/database/repositories/BlockValueRepository";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "@/api/utils/responseUtils";
import Logger from "@/tools/Logger";

export class BlockValueController {
  private blockValueRepository: BlockValueRepository;
  private logger: Logger;

  constructor(blockValueRepository: BlockValueRepository, logger: Logger) {
    this.blockValueRepository = blockValueRepository;
    this.logger = logger;
  }

  async getLatestBlockDetails(req: Request, res: Response): Promise<void> {
    try {
      const chainId: number = parseInt(req.query.chainId as string);
      if (!Object.keys(chainTableMapping).includes(chainId.toString())) {
        sendErrorResponse(res, 400, "Invalid chain ID");
        return;
      }

      const result =
        await this.blockValueRepository.getLatestBlockNumber(chainId);
      if (result) {
        sendSuccessResponse(res, result);
      } else {
        sendErrorResponse(
          res,
          404,
          "No latest block information found for the given chain ID",
        );
      }
    } catch (error) {
      this.logger.error("Error fetching latest block details:", error);
      sendErrorResponse(res, 500, "Internal server error");
    }
  }
}
