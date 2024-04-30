import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sync_status", function (table) {
    table.index(["chain_id", "submission_type", "timestamp"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sync_status", function (table) {
    table.dropIndex(["chain_id", "submission_type", "timestamp"]);
  });
}
