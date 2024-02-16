// PriceService.ts
import { PriceRecord, PriceRepository } from '../../../../database/repositories/PricingRepository'
import { UnixTime } from '../../../../core/types/UnixTime';

export class PriceService {
  constructor(private pricingRepository: PriceRepository) {}

  async getPriceWithRetry(contractAddress: string, timestamp: UnixTime, retryInterval = 5000, maxRetries = 12): Promise<PriceRecord | undefined> {
    for (let i = 0; i < maxRetries; i++) {
      const priceRecord = await this.pricingRepository.findByTimestampAndToken(timestamp, contractAddress);
      if (priceRecord) return priceRecord;

      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
    return undefined;
  }
}
