import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sync_status", function (table) {
    table.dropPrimary();
    table.primary(["chain_id", "submission_type", "l2_block_number"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sync_status", function (table) {
    table.dropPrimary();
    table.primary(["chain_id", "l2_block_number", "submission_type"]);
  });
}
