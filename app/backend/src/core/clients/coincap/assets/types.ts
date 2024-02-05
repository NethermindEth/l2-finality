interface ContractDetails {
  address: string;
  decimals: number;
}

interface ContractAddresses {
  [key: string]: ContractDetails;
}

export interface WhitelistedAsset {
  coincap_asset_id: string;
  coinmarketcap_asset_id: string | null;
  name: string;
  ticker: string;
  contracts: ContractAddresses;
}
