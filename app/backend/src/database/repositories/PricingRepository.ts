import { Knex } from "knex";
import { UnixTime } from "../../core/types/UnixTime";

export const TABLE_NAME = "asset_prices";

export interface PriceRecord {
  assetId: string;
  priceUsd: number;
  timestamp: UnixTime;
}

interface PriceRow {
  asset_id: string;
  price_usd: number;
  timestamp: Date;
}

export interface DataBoundary {
  earliest: UnixTime;
  latest: UnixTime;
}

export class PriceRepository {
  private readonly knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async getByTimestamp(timestamp: UnixTime): Promise<PriceRecord[]> {
    const row: PriceRow[] = await this.knex(TABLE_NAME).where(
      "timestamp",
      timestamp.toDate(),
    );
    return row.map(toRecord);
  }

  async getByToken(assetId: string): Promise<PriceRecord[]> {
    const row: PriceRow[] = await this.knex(TABLE_NAME).where(
      "asset_id",
      assetId,
    );
    return row.map(toRecord);
  }

  async findByTimestampAndToken(timestamp: UnixTime, assetId: string) {
    const row = await this.knex(TABLE_NAME)
      .where({
        asset_id: assetId,
        timestamp: timestamp.toDate(),
      })
      .first();
    return row ? toRecord(row) : undefined;
  }

  async addMany(prices: PriceRecord[]) {
    const rows: PriceRow[] = prices.map(toRow);

    await this.knex(TABLE_NAME)
      .insert(rows)
      .onConflict(["asset_id", "timestamp"])
      .merge();

    return rows.length;
  }

  async deleteAll() {
    return this.knex(TABLE_NAME).delete();
  }

  async findLatestByToken(
    from: UnixTime,
  ): Promise<Map<string, UnixTime | undefined>> {
    const rows = await this.knex(TABLE_NAME)
      .max("timestamp")
      .select("asset_id")
      .groupBy("asset_id")
      .where("timestamp", ">=", from.toDate());

    return new Map(
      rows.map((row) => [row.asset_id, UnixTime.fromDate(row.max)]),
    );
  }
}

function toRecord(row: PriceRow): PriceRecord {
  return {
    timestamp: UnixTime.fromDate(row.timestamp),
    assetId: row.asset_id,
    priceUsd: +row.price_usd,
  };
}

function toRow(record: PriceRecord): PriceRow {
  return {
    asset_id: record.assetId.toString(),
    price_usd: record.priceUsd,
    timestamp: record.timestamp.toDate(),
  };
}
