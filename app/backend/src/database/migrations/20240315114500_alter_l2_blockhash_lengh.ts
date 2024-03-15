import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sync_status", function (table) {
    table.string("l2_block_hash", 100).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sync_status", function (table) {
    table.string("l2_block_hash", 66).alter();
  });
}
