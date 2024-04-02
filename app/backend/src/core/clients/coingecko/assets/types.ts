import whitelisted from "@/core/clients/coingecko/assets/whitelisted.json";
import { ZeroAddress } from "ethers";
import { getAddress } from "@/core/clients/blockchain/IBlockchainClient";

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
  // Cache address -> checksummed address mapping for whitelisted assets as SHA is slow
  private readonly cache: { [address: string]: string | undefined } = {};

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
    const cachedAddress = this.cache[address];

    const chainMap = this[chainId];
    if (!chainMap) return undefined;

    const checksumAddress = cachedAddress ?? getAddress(address);
    const result = chainMap[checksumAddress];

    if (result && !cachedAddress) {
      this.cache[address] = checksumAddress;
    }

    return result;
  }

  getSymbolByAddress(chainId: number, address: string): string | undefined {
    if (address == ZeroAddress) return "ETH";

    return this.getAssetByAddress(chainId, address)?.symbol;
  }
}

export const whitelistedMap = new WhitelistedMap(whitelisted);
