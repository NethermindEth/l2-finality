interface ContractDetails {
  address: string;
  decimals: number;
}

interface ContractAddresses {
  [key: string]: ContractDetails;
}

export interface WhitelistedAsset {
  coingeckoId: string;
  deploymentTimestamp: number;
  coingeckoListingTimestamp: number;
  name: string;
  ticker: string;
  contracts: ContractAddresses;
}
