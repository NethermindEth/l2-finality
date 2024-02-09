import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("l2_block_values", function (table) {
    table.integer("chain_id").notNullable();
    table.bigInteger("l2_block_number").notNullable();
    table.string("l2_block_hash", 66).notNullable();
    table.timestamp("l2_block_timestamp").notNullable();
    table.jsonb("value").notNullable();
    table.primary(["chain_id", "l2_block_number", "l2_block_hash"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("l2_block_values");
}
