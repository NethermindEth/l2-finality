import { MetadataRepository } from "@/database/repositories/MetadataRepository";
import Logger from "@/tools/Logger";
import { Request, Response } from "express";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "@/api/utils/responseUtils";

export class MetadataController {
  private metadataRepository: MetadataRepository;
  private logger: Logger;

  constructor(metadataRepository: MetadataRepository, logger: Logger) {
    this.metadataRepository = metadataRepository;
    this.logger = logger;
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const metadataRecords = await this.metadataRepository.getAll();
      if (metadataRecords) {
        sendSuccessResponse(res, { metadataRecords });
      } else {
        sendErrorResponse(res, 404, "No metadata found");
      }
    } catch (error) {
      this.logger.error("Error getting metadata:", error);
      sendErrorResponse(res, 500, "Internal error getting metadata");
    }
  }
}
