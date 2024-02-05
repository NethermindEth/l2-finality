import { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.createTable("asset_prices", function (table) {
    table.string("asset_id").notNullable();
    table.decimal("price_usd", 14, 4).notNullable();
    table.timestamp("timestamp").notNullable();
    table.primary(["asset_id", "timestamp"]);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex) {
  await knex.schema.dropTable("asset_prices");
}
