import {
  PriceRecord,
  PriceRepository,
} from "@/database/repositories/PricingRepository";
import { WhitelistedAsset } from "@/core/clients/coingecko/assets/types";
import whitelisted from "@/core/clients/coingecko/assets/whitelisted.json";
import { TimeRange, UnixTime } from "@/core/types/UnixTime";
import Logger from "@/tools/Logger";
import { CoinGeckoClient } from "@/core/clients/coingecko/CoinGeckoClient";
import { PricingModuleConfig } from "@/config/Config";
import { DataBoundary } from "@/database/repositories/PricingRepository";

export class PriceUpdaterController {
  private readonly client: CoinGeckoClient;
  private readonly priceRepository: PriceRepository;
  private readonly logger: Logger;
  private readonly whitelistedAssets: WhitelistedAsset[];
  private readonly intervalMinutes: number;

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
    this.intervalMinutes = config.intervalMinutes;
  }

  async start() {
    await this.updateSpotPrices();
  }

  public async backfillHistory(backfillPeriodDays: number) {
    if (!backfillPeriodDays) return;

    // To guarantee hourly data from the CoinGecko endpoint
    if (backfillPeriodDays < 2 || backfillPeriodDays > 90) {
      this.logger.warn(
        "Supported history backfill period is between 2 and 90 days.",
      );
      backfillPeriodDays = Math.max(2, Math.min(90, backfillPeriodDays));
    }

    const now = UnixTime.now();
    const boundaries = await this.priceRepository.findBoundariesByToken();

    const backfilledIds = new Set<string>();
    for (const asset of this.whitelistedAssets) {
      if (backfilledIds.has(asset.coingeckoId)) continue;
      else backfilledIds.add(asset.coingeckoId);

      await this.tryBackfillHistoryFor(
        asset,
        { from: now.add(-backfillPeriodDays, "days"), to: now },
        boundaries.get(asset.coingeckoId),
      );
    }

    const execSec = UnixTime.now().toSeconds() - now.toSeconds();
    this.logger.info(`Backfilled history for all the assets in ${execSec}s`);
  }

  private async tryBackfillHistoryFor(
    asset: WhitelistedAsset,
    range: TimeRange,
    boundaries: DataBoundary | undefined,
  ) {
    try {
      range = this.adjustHistoryRange(asset, range, boundaries)!;
      if (!range) return;

      let [fromStr, toStr] = [range.from.toISOString(), range.to.toISOString()];
      const response = await this.client.getHistory(asset.coingeckoId, range);

      if (!response.length) {
        this.logger.warn(
          `Attempted to backfill history for ${asset.coingeckoId} from ${fromStr} to ${toStr} but got no records`,
        );
        return;
      }

      const priceRecords = response.map((price) => ({
        assetId: asset.coingeckoId,
        priceUsd: price.price,
        timestamp: this.roundToMinutes(price.timestamp, 60),
      }));

      await this.priceRepository.addMany(priceRecords);

      [fromStr, toStr] = [
        priceRecords[0].timestamp.toISOString(),
        priceRecords.slice(-1)[0].timestamp.toISOString(),
      ];
      this.logger.info(
        `Backfilled history for ${asset.coingeckoId} from ${fromStr} to ${toStr} with ${priceRecords.length} records`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to backfill history for ${asset.coingeckoId}: ${error}`,
      );
    }
  }

  private async updateSpotPrices() {
    const ids = whitelisted.map((a) => a.coingeckoId);

    const prices = await this.client.getSpotPrices(ids);
    const priceRecords: PriceRecord[] = [];

    for (const entry of Object.entries(prices)) {
      const [assetId, price] = entry;
      if (!price) {
        this.logger.warn(`No active price for ${assetId}`);
        continue;
      }

      const diff = UnixTime.now().toMinutes() - price.timestamp.toMinutes();
      if (diff > this.intervalMinutes) {
        this.logger.warn(
          `Spot price for ${assetId} outdated for ${diff} minutes`,
        );
      }

      priceRecords.push({
        assetId: assetId,
        priceUsd: price.price,
        timestamp: this.roundToMinutes(price.timestamp, this.intervalMinutes),
      });
    }

    const upsertedCount = await this.priceRepository.addMany(priceRecords);
    this.logger.debug(`Upserted ${upsertedCount} active price records`);
  }

  private roundToMinutes(time: UnixTime, minutes: number) {
    const date = time.toDate();
    date.setMinutes(Math.round(date.getMinutes() / minutes) * minutes, 0, 0);
    return UnixTime.fromDate(date);
  }

  private adjustHistoryRange(
    asset: WhitelistedAsset,
    range: TimeRange,
    boundary: DataBoundary | undefined,
  ): TimeRange | undefined {
    const assetFrom = Math.max(
      asset.deploymentTimestamp,
      asset.coingeckoListingTimestamp,
    );

    // eslint-disable-next-line prefer-const
    let { from, to } = range;
    if (assetFrom > from.toSeconds()) from = new UnixTime(assetFrom);

    if (
      boundary != undefined &&
      boundary.earliest <= from.add(1, "hours") &&
      boundary.latest >= to.add(-1, "hours")
    ) {
      return undefined; // no need to backfill
    }

    return to.toSeconds() > from.add(1, "hours").toSeconds()
      ? { from, to } // do not feel range of less than 1 hour
      : undefined;
  }
}

export default PriceUpdaterController;
