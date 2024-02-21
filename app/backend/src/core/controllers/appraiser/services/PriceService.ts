import {
  PriceRecord,
  PriceRepository,
} from "@/database/repositories/PricingRepository";
import { UnixTime } from "@/core/types/UnixTime";
import Logger from "@/tools/Logger";

export class PriceService {
  private logger: Logger;
  private useFake: boolean;
  constructor(
    private pricingRepository: PriceRepository,
    logger: Logger,
    useFake: boolean = false,
  ) {
    this.useFake = useFake;
    this.logger = logger;
  }

  async getPriceWithRetry(
    contractAddress: string,
    timestamp: UnixTime,
    retryInterval = 5000,
    maxRetries = 12,
  ): Promise<PriceRecord | undefined> {
    if (this.useFake) {
      return {
        assetId: "0x",
        timestamp: UnixTime.now(),
        priceUsd: 1,
      };
    }

    for (let i = 0; i < maxRetries; i++) {
      const priceRecord = await this.pricingRepository.findByTimestampAndToken(
        timestamp,
        contractAddress,
      );
      if (priceRecord) return priceRecord;

      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
    this.logger.error(
      `Critical error: could not find price for ${contractAddress} at ${timestamp} after ${maxRetries} retries.`,
    );
    return undefined;
  }
}
