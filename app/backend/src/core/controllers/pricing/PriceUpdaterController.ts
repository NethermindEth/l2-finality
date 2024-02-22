import { PriceRecord, PriceRepository } from "@/database/repositories/PricingRepository";
import { WhitelistedAsset } from "@/core/clients/coingecko/assets/types";
import whitelisted from "@/core/clients/coingecko/assets/whitelisted.json";
import { UnixTime } from "@/core/types/UnixTime";
import Logger from "@/tools/Logger";
import { CoinGeckoClient } from "@/core/clients/coingecko/CoinGeckoClient";
import { PricingModuleConfig } from "@/config/Config";

export class PriceUpdaterController {
  private readonly client: CoinGeckoClient;
  private readonly priceRepository: PriceRepository;
  private readonly logger: Logger;
  private readonly whitelistedAssets: WhitelistedAsset[];
  private readonly backfillPeriodDays: number;
  private readonly pollIntervalMs: number;

  constructor(
    client: CoinGeckoClient,
    priceRepository: PriceRepository,
    config: PricingModuleConfig,
    logger: Logger,
  ) {
    this.client = client;
    this.priceRepository = priceRepository;
    this.logger = logger;
    this.whitelistedAssets = whitelisted;
    this.backfillPeriodDays = config.backfillPeriodDays;
    this.pollIntervalMs = config.pollIntervalMs;
  }

  async start() {
    await this.updateActivePrices();
    await this.backfillHistory();
  }

  private async backfillHistory() {
    const now = UnixTime.now();
    const earliest = await this.priceRepository.findEarliestByToken();

    for (const asset of this.whitelistedAssets) {
      const range = this.calculateHistoryRange(now, asset, earliest.get(asset.coingeckoId));
      if (!range) continue;

      const response = await this.client.getHistory(asset.coingeckoId, range.from, range.to);

      if (!response.length)
        continue;

      const priceRecords = response.map((price) => ({
        assetId: asset.coingeckoId,
        priceUsd: price.price,
        timestamp: UnixTime.fromDate(price.timestamp.toDate())
      }));

      await this.priceRepository.addMany(priceRecords);

      const [fromStr, toStr] = [range.from.toDate().toISOString(), range.to.toDate().toISOString()];
      this.logger.info(`Backfilled history for ${asset.coingeckoId} from ${fromStr} to ${toStr} with ${priceRecords.length} records`);
    }
  }

  private async updateActivePrices() {
    const ids = whitelisted.map(a => a.coingeckoId);

    const prices = await this.client.getPrices(ids);
    const priceRecords: PriceRecord[] = [];

    for (const entry of Object.entries(prices)) {
      const [assetId, price] = entry;
      if (!price) {
        this.logger.warn(`No active price for ${assetId}`);
        continue;
      }

      priceRecords.push({
        assetId: assetId,
        priceUsd: price.price,
        timestamp: price.timestamp
      });
    }

    const upsertedCount = await this.priceRepository.addMany(priceRecords);
    this.logger.debug(`Upserted ${upsertedCount} active price records`);
  }

  private calculateHistoryRange(now: UnixTime, asset: WhitelistedAsset, earliest: UnixTime | undefined): {
    from: UnixTime,
    to: UnixTime
  } | undefined {
    let to = now;
    let from = to.add(-this.backfillPeriodDays, "days");

    const assetFrom = Math.max(asset.deploymentTimestamp, asset.coingeckoListingTimestamp);

    if (assetFrom > from.toSeconds())
      from = new UnixTime(assetFrom);

    if (earliest !== undefined && earliest.toSeconds() < to.toSeconds())
      to = earliest.add(-1, 'hours');

    return to.toSeconds() > from.add(1, 'hours').toSeconds()
      ? {from, to} // do not feel range of less than 1 hour
      : undefined;
  }
}

export default PriceUpdaterController;
