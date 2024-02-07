import { PriceRepository } from "../../../database/repositories/PricingRepository";
import { WhitelistedAsset } from "../../../core/clients/coincap/assets/types";
import whitelisted from "../../clients/coincap/assets/whitelisted.json";
import CoinCapClient from "./../../clients/coincap/CoinCapClient";
import { UnixTime } from "../../../core/types/UnixTime";
import Logger from "../../../tools/Logger";

export class PriceUpdaterController {
  private readonly coinCapClient: CoinCapClient;
  private readonly priceRepository: PriceRepository;
  private readonly whitelistedAssets: WhitelistedAsset[];
  private readonly logger: Logger;

  private priceIntervalMinutes: number;
  private maxApiReturnDays: number;

  private batchSize: number;
  private batchDurationInMs: number;

  constructor(
    coinCapClient: CoinCapClient,
    priceRepository: PriceRepository,
    logger: Logger,
  ) {
    this.coinCapClient = coinCapClient;
    this.priceRepository = priceRepository;
    this.logger = logger;

    this.whitelistedAssets = whitelisted;
    this.priceIntervalMinutes = 15;
    this.maxApiReturnDays = 7;

    this.batchSize =
      (this.maxApiReturnDays * 24 * 60 * 60 * 1000) /
      (this.priceIntervalMinutes * 60 * 1000);
    this.batchDurationInMs =
      this.batchSize * (this.priceIntervalMinutes * 60 * 1000);
  }

  async start() {
    await this.updatePricesForAllAssets();
  }

  private async updatePricesForAllAssets() {
    const latestBoundaries = await this.priceRepository.findLatestByToken(
      UnixTime.now().add(-30, "days"),
    );
    for (const asset of this.whitelistedAssets) {
      const latestBoundary: UnixTime | undefined = latestBoundaries.get(
        asset.coincap_asset_id,
      );
      await this.updatePricesForAsset(asset, latestBoundary);
    }
  }

  private async updatePricesForAsset(
    asset: WhitelistedAsset,
    latestBoundary?: UnixTime,
  ) {
    // It will fetch the last 30 days of data if there is no latestBoundary, ie. new assets
    // If the latestBoundary is older than the priceIntervalMinutes (15 min refresh rate), it will fetch latest data
    const now: UnixTime = UnixTime.now();
    const thresholdTime: UnixTime = now.add(
      -this.priceIntervalMinutes,
      "minutes",
    );

    const from: UnixTime = latestBoundary ?? now.add(-30, "days");
    if (from.toDate().getTime() < thresholdTime.toDate().getTime()) {
      this.logger.info(
        `Updating prices for ${asset.coincap_asset_id} from ${from.toDate()} to ${now.toDate()}`,
      );
      await this.fetchAndSavePrices(asset, from, now);
    }
  }

  private async fetchAndSavePrices(
    asset: WhitelistedAsset,
    from: UnixTime,
    to: UnixTime,
  ) {
    let batchFrom = from;

    while (batchFrom.toDate().getTime() < to.toDate().getTime()) {
      const batchToEndTimestamp = Math.min(
        batchFrom.toDate().getTime() + this.batchDurationInMs,
        to.toDate().getTime(),
      );
      const batchTo = UnixTime.fromDate(new Date(batchToEndTimestamp));
      await this.fetchPricesInBatch(asset, batchFrom, batchTo);
      batchFrom = UnixTime.fromDate(new Date(batchToEndTimestamp));
    }
  }

  private async fetchPricesInBatch(
    asset: WhitelistedAsset,
    from: UnixTime,
    to: UnixTime,
  ) {
    const response = await this.coinCapClient.getHistoricalPrices({
      coincapAssetId: asset.coincap_asset_id,
      interval: "m15",
      start: from.toDate().getTime(),
      end: to.toDate().getTime(),
    });

    const priceRecords = response.data.map((price) => ({
      assetId: asset.coincap_asset_id,
      priceUsd: price.priceUsd,
      timestamp: UnixTime.fromDate(new Date(price.time)),
    }));

    await this.priceRepository.addMany(priceRecords);
  }
}

export function getClosestTimestamp(
  timestamp: UnixTime,
  intervalMinutes: number = 15,
): UnixTime {
  const intervalMs = intervalMinutes * 60 * 1000;
  const timestampMs = timestamp.toDate().getTime();
  const closestTimestampMs = Math.floor(timestampMs / intervalMs) * intervalMs;
  return UnixTime.fromDate(new Date(closestTimestampMs));
}

export default PriceUpdaterController;
