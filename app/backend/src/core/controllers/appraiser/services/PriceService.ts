import {
  PriceRecord,
  PriceRepository,
} from "@/database/repositories/PricingRepository";
import { UnixTime } from "@/core/types/UnixTime";
import Logger from "@/tools/Logger";
import whitelist from "@/core/clients/coingecko/assets/whitelisted.json";
import { WhitelistedAsset } from "@/core/clients/coingecko/assets/types";
import { ethers } from "ethers";

export class PriceService {
  private readonly monitoredAssets: WhitelistedAsset[];

  constructor(
    private pricingRepository: PriceRepository,
    private logger: Logger,
    private useFake: boolean = false,
  ) {
    this.monitoredAssets = whitelist as WhitelistedAsset[];
  }

  async getPriceForContract(
    contractAddress: string,
    timestamp: UnixTime,
  ): Promise<PriceRecord | undefined> {
    if (this.useFake) {
      return {
        assetId: "0x",
        timestamp: UnixTime.now(),
        priceUsd: 1,
      };
    }

    let assetId: string;

    if (contractAddress === ethers.ZeroAddress) {
      assetId = "ethereum";
    } else {
      const asset = this.monitoredAssets.find(
        (a: WhitelistedAsset) => a.address === contractAddress,
      );
      if (!asset) {
        this.logger.error(`Asset not found for ${contractAddress}`);
        return undefined;
      }
      assetId = asset.coingeckoId;
    }

    const priceRecord = await this.pricingRepository.findByTimestampAndToken(
      timestamp,
      assetId,
    );
    if (!priceRecord) {
      this.logger.error(
        `Price not found for ${contractAddress} at ${timestamp.toDate()}`,
      );
    }
    return priceRecord;
  }
}
