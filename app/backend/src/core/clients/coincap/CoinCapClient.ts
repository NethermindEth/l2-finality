import axios from "axios";
import { Config } from "@/config/Config";
import rateLimit from "axios-rate-limit";
import Logger from "@/tools/Logger";
import { handleError } from "./utils";
import { CoinCapHistoryResponse } from "./types";

type coincapIntervals =
  | "m1"
  | "m5"
  | "m15"
  | "m30"
  | "h1"
  | "h2"
  | "h6"
  | "h12"
  | "d1";

interface AssetHistoryParams {
  coincapAssetId: string;
  interval: coincapIntervals;
  start: number;
  end: number;
}

export class CoinCapClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly rateLimit: number;
  private readonly logger: Logger;

  private readonly headers: Record<string, string>;
  private readonly http: ReturnType<typeof rateLimit>;

  constructor(config: Config, logger: Logger) {
    this.baseUrl = config.pricingModule.coinCapBaseUrl;
    this.apiKey = config.pricingModule.coinCapApiKey;
    this.rateLimit = config.pricingModule.maxMinuteRateLimit;
    this.logger = logger;

    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Accept-Encoding": "gzip, deflate",
    };

    this.http = rateLimit(axios.create(), {
      maxRequests: this.rateLimit,
      perMilliseconds: 60000,
    });
  }

  async getHistoricalPrices({
    coincapAssetId,
    interval,
    start,
    end,
  }: AssetHistoryParams): Promise<CoinCapHistoryResponse> {
    const url = `${this.baseUrl}/assets/${coincapAssetId}/history?interval=${interval}&start=${start}&end=${end}&limit=2000`;
    try {
      const response = await this.http.get<CoinCapHistoryResponse>(url, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      handleError(error, this.logger);
      throw new Error("Failed to fetch historical prices");
    }
  }
}

export default CoinCapClient;
