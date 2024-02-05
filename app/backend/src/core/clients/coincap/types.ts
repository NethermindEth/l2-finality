export interface CoinCapPriceHistoryRecord {
  priceUsd: number;
  time: number;
  circulatingSupply: number;
  date: string;
}

export interface CoinCapHistoryResponse {
  data: CoinCapPriceHistoryRecord[];
  timestamp: number;
}
