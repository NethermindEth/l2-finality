import { Knex } from "knex";
import { expect } from "earl";
import {
  PriceRecord,
  PriceRepository,
  PriceRow,
  TABLE_NAME,
} from "./PricingRepository";
import { getTestDatabase } from "@/database/getTestDatabase";
import { UnixTime } from "@/core/types/UnixTime";

describe(PriceRepository.name, () => {
  let repository: PriceRepository;
  let knexInstance: Knex;

  beforeEach(async () => {
    knexInstance = await getTestDatabase();
    repository = new PriceRepository(knexInstance);
  });

  afterEach(async () => {
    await knexInstance.destroy();
  });

  describe(PriceRepository.prototype.addMany.name, () => {
    it("adds multiple price records", async () => {
      const prices: PriceRecord[] = [
        {
          assetId: "ETH",
          priceUsd: 2000,
          timestamp: UnixTime.now(),
        },
        {
          assetId: "BTC",
          priceUsd: 40000,
          timestamp: UnixTime.now(),
        },
      ];

      const addedCount = await repository.addMany(prices);

      expect(addedCount).toEqual(prices.length);
    });
  });

  describe(PriceRepository.prototype.getByTimestamp.name, () => {
    it("retrieves price records by timestamp", async () => {
      const timestamp = UnixTime.now();
      const expectedPrices: PriceRecord[] = [
        {
          assetId: "MATIC",
          priceUsd: 20,
          timestamp,
        },
        {
          assetId: "SOL",
          priceUsd: 100,
          timestamp,
        },
      ];

      await repository.addMany(expectedPrices);
      const retrievedPrices = await repository.getByTimestamp(timestamp);

      expect(retrievedPrices).toEqual(expectedPrices);
    });
  });

  describe(PriceRepository.prototype.getByToken.name, () => {
    it("retrieves price records by token", async () => {
      const assetId = "GMX";
      const expectedPrices: PriceRecord[] = [
        {
          assetId,
          priceUsd: 2000,
          timestamp: UnixTime.now(),
        },
        {
          assetId,
          priceUsd: 2200,
          timestamp: UnixTime.now().add(-1, "hours"),
        },
      ];

      await repository.addMany(expectedPrices);
      const retrievedPrices = await repository.getByToken(assetId);

      expectedPrices.sort((a, b) => a.priceUsd - b.priceUsd);
      retrievedPrices.sort((a, b) => a.priceUsd - b.priceUsd);

      expect(retrievedPrices).toEqual(expectedPrices);
    });
  });

  describe(PriceRepository.prototype.getLatestAndPreviousByToken.name, () => {
    it("returns map of latest and previous prices by token", async () => {
      const testData: PriceRow[] = [
        {
          asset_id: "BTC",
          price_usd: 40000,
          timestamp: UnixTime.now().add(-1, "hours").toDate(),
        },
        {
          asset_id: "BTC",
          price_usd: 41000,
          timestamp: UnixTime.now().toDate(),
        },
        {
          asset_id: "ETH",
          price_usd: 2000,
          timestamp: UnixTime.now().add(-1, "hours").toDate(),
        },
        {
          asset_id: "ETH",
          price_usd: 2100,
          timestamp: UnixTime.now().toDate(),
        },
      ];
      await knexInstance(TABLE_NAME).insert(testData);

      const result = await repository.getLatestAndPreviousByToken();

      expect(result.size).toEqual(2);

      expect(result.get("BTC")).toEqual({
        latestPrice: {
          price: "41000.0000",
          timestamp: testData[1].timestamp,
        },
        previousPrice: {
          price: "40000.0000",
          timestamp: testData[0].timestamp,
        },
      });

      expect(result.get("ETH")).toEqual({
        latestPrice: {
          price: "2100.0000",
          timestamp: testData[3].timestamp,
        },
        previousPrice: {
          price: "2000.0000",
          timestamp: testData[2].timestamp,
        },
      });
    });
  });
});
