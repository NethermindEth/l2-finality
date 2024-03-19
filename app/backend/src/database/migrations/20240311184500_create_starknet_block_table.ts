import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("starknet_blocks", function (table) {
    table.bigInteger("l2_block_number").notNullable();
    table.string("l2_block_hash", 66).notNullable();
    table.timestamp("l2_block_timestamp").notNullable();
    table.jsonb("value").notNullable();
    table.primary(["l2_block_number", "l2_block_hash"]);

    table.bigInteger("gas_fees").notNullable();
    table.decimal("gas_fees_usd", 18, 4).notNullable().defaultTo(0);
    table.bigInteger("block_reward").notNullable();
    table.decimal("block_reward_usd", 18, 4).notNullable().defaultTo(0);
    table.primary(["l2_block_number", "l2_block_hash"]);

    table.index("l2_block_number");
    table.index("l2_block_timestamp");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("starknet_blocks");
}
