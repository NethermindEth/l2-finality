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
