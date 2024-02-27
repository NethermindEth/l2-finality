import axios from "axios";
import { Config } from "@/config/Config";
import rateLimit from "axios-rate-limit";
import Logger from "@/tools/Logger";
import { handleError } from "./utils";
import { TimeRange, UnixTime } from "@/core/types/UnixTime";
import { AssetPriceMap, PriceEntry } from "./types";

type SpotPricesResponse = {
  [id: string]: { usd: number; last_updated_at: number };
};

type HistoryResponse = {
  prices: number[][];
};

export class CoinGeckoClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiKeyHeader: string;
  private readonly rateLimit: number;
  private readonly logger: Logger;

  private readonly headers: Record<string, string>;
  private readonly http: ReturnType<typeof rateLimit>;

  constructor(config: Config, logger: Logger) {
    this.baseUrl = config.pricingModule.baseUrl;
    this.apiKey = config.pricingModule.apiKey;
    this.apiKeyHeader = config.pricingModule.apiKeyHeader;
    this.rateLimit = config.pricingModule.maxMinuteRateLimit;
    this.logger = logger;

    this.headers = {
      [this.apiKeyHeader]: this.apiKey,
      "Accept-Encoding": "gzip, deflate",
    };

    this.http = rateLimit(axios.create(), {
      maxRequests: this.rateLimit,
      perMilliseconds: 60000,
    });
  }

  async getSpotPrices(coingeckoIds: string[]): Promise<AssetPriceMap> {
    const noCache = UnixTime.now().toSeconds();
    const url = `${this.baseUrl}/simple/price?include_last_updated_at=true&vs_currencies=usd&ids=${coingeckoIds.join(",")}&c=${noCache}`;

    return this.makeHttpGet<SpotPricesResponse, AssetPriceMap>(url, (data) =>
      Object.fromEntries(
        coingeckoIds.map((id) => {
          const entry = data[id];
          return [
            id,
            entry
              ? {
                  timestamp: new UnixTime(entry.last_updated_at),
                  price: entry.usd,
                }
              : undefined,
          ];
        }),
      ),
    );
  }

  async getHistory(
    coingeckoId: string,
    range: TimeRange,
  ): Promise<PriceEntry[]> {
    const url = `${this.baseUrl}/coins/${coingeckoId}/market_chart/range?from=${range.from}&to=${range.to}&vs_currency=usd`;

    return this.makeHttpGet<HistoryResponse, PriceEntry[]>(url, (data) =>
      data.prices.map((x) => ({
        timestamp: new UnixTime(x[0]),
        price: x[1],
      })),
    );
  }

  private async makeHttpGet<TResponse, TResult>(
    url: string,
    transformResponse: (data: TResponse) => TResult,
  ): Promise<TResult> {
    try {
      const response = await this.http.get<TResponse>(url, {
        headers: this.headers,
      });
      return transformResponse(response.data);
    } catch (error) {
      handleError(error, this.logger);
      throw new Error(`Failed to GET ${url}: ${error}`);
    }
  }
}

export default CoinGeckoClient;
