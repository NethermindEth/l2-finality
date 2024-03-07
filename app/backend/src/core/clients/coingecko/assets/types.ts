import whitelisted from "@/core/clients/coingecko/assets/whitelisted.json";
import { ethers, ZeroAddress } from "ethers";

export interface WhitelistedAsset {
  name: string;
  coingeckoId: string;
  address?: string;
  symbol: string;
  decimals: number;
  deploymentTimestamp: number;
  coingeckoListingTimestamp: number;
  chainId: number;
}

export class WhitelistedMap {
  [chainId: number]: { [symbol: string]: WhitelistedAsset };

  constructor(assets: WhitelistedAsset[]) {
    for (const asset of assets) {
      if (!asset.address) continue;
      const chainMap = (this[asset.chainId] ??= {});
      chainMap[asset.address] = asset;
      chainMap[asset.symbol] = asset;
    }
  }

  getAssetBySymbol(
    chainId: number,
    symbol: string,
  ): WhitelistedAsset | undefined {
    const chainMap = this[chainId];
    if (!chainMap) return undefined;

    return chainMap[symbol];
  }

  getAssetByAddress(
    chainId: number,
    address: string,
  ): WhitelistedAsset | undefined {
    const chainMap = this[chainId];
    if (!chainMap) return undefined;

    return chainMap[ethers.getAddress(address)];
  }

  getSymbolByAddress(chainId: number, address: string): string | undefined {
    if (address == ZeroAddress) return "ETH";

    return this.getAssetByAddress(chainId, address)?.symbol;
  }
}

export const whitelistedMap = new WhitelistedMap(whitelisted);
