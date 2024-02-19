import { Request, Response } from "express";
import { PriceRepository } from "@/database/repositories/PricingRepository"; // Adjust the import path as necessary
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "@/api/utils/responseUtils";
import Logger from "@/tools/Logger";

type Price = {
  price: number;
  timestamp: Date;
};

export class PricingController {
  private pricingRepository: PriceRepository;
  private logger: Logger;

  constructor(pricingRepository: PriceRepository, logger: Logger) {
    this.pricingRepository = pricingRepository;
    this.logger = logger;
  }

  async getLatestPrices(req: Request, res: Response): Promise<void> {
    try {
      const latestPricing =
        await this.pricingRepository.getLatestAndPreviousByToken();

      const pricingData: Record<
        string,
        { latestPrice: Price; previousPrice: Price }
      > = {};
      latestPricing.forEach((value, key) => {
        pricingData[key] = value;
      });

      if (latestPricing.size > 0) {
        sendSuccessResponse(res, { ...pricingData });
      } else {
        sendErrorResponse(res, 404, "No pricing information found");
      }
    } catch (error) {
      console.error("Error getting latest pricing information:", error);
      sendErrorResponse(
        res,
        500,
        "Internal error getting latest pricing information",
      );
    }
  }
}
