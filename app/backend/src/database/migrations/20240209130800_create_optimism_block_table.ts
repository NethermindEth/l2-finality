import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("optimism_blocks", function (table) {
    table.bigInteger("l2_block_number").notNullable();
    table.string("l2_block_hash", 66).notNullable();
    table.timestamp("l2_block_timestamp").notNullable();
    table.jsonb("value").notNullable();
    table.primary(["l2_block_number", "l2_block_hash"]);

    table.index("l2_block_number");
    table.index("l2_block_timestamp");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("optimism_blocks");
}
