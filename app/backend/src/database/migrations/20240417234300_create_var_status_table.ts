import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("var_status", function (table) {
    table.integer("chain_id").notNullable();
    table.timestamp("timestamp").notNullable();
    table.bigInteger("last_l2_block_number").notNullable();
    table.timestamp("last_sync_at").notNullable();
    table.jsonb("var_by_contract").notNullable();
    table.jsonb("var_by_type").notNullable();
    table.decimal("var_total_usd", 14, 4).notNullable();

    table.primary(["chain_id", "timestamp"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("var_status");
}
