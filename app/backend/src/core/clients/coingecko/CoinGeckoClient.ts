import axios from "axios";
import { Config } from "@/config/Config";
import rateLimit from "axios-rate-limit";
import Logger from "@/tools/Logger";
import { handleError } from "./utils";
import { UnixTime } from "@/core/types/UnixTime";
import { PriceEntry } from "./types";

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
      "Accept-Encoding": "gzip, deflate"
    };

    this.http = rateLimit(axios.create(), {
      maxRequests: this.rateLimit,
      perMilliseconds: 60000,
    });
  }

  async getPrices(coingeckoIds: string[]): Promise<{ [id: string]: PriceEntry | undefined }> {
    const noCache = UnixTime.now().toSeconds();
    const url = `${this.baseUrl}/simple/price?include_last_updated_at=true&vs_currencies=usd&ids=${coingeckoIds.join(',')}&c=${noCache}`;

    try {
      const response = await this.http.get<{ [id: string]: { usd: number, last_updated_at: number } }>(url, {
        headers: this.headers
      });

      return Object.fromEntries(coingeckoIds.map(id => {
        const entry = response.data[id];
        return [id, entry ? {timestamp: new UnixTime(entry.last_updated_at), price: entry.usd} : undefined];
      }));
    } catch (error) {
      handleError(error, this.logger);
      throw new Error("Failed to fetch prices");
    }
  }

  async getHistory(coingeckoId: string, from: UnixTime, to: UnixTime): Promise<PriceEntry[]> {
    const url = `${this.baseUrl}/coins/${coingeckoId}/market_chart/range?from=${from}&to=${to}&vs_currency=usd`;

    try {
      const response = await this.http.get<({ prices: number[][] })>(url, {
        headers: this.headers
      });

      return response.data.prices.map(x => ({
        timestamp: new UnixTime(x[0]),
        price: x[1]
      }));
    } catch (error) {
      handleError(error, this.logger);
      throw new Error("Failed to fetch history");
    }
  }
}

export default CoinGeckoClient;
