import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("sync_status", function (table) {
    table.integer("chain_id").notNullable();
    table.bigInteger("l2_block_number").notNullable();
    table.string("l2_block_hash", 66).nullable();
    table.bigInteger("l1_block_number").nullable();
    table.string("l1_block_hash", 66).nullable();
    table.timestamp("timestamp").notNullable();
    table
      .enum("submission_type", [
        "data_submission",
        "l2_finalization",
        "proof_submission",
        "state_updates",
      ])
      .notNullable();

    table.primary(["chain_id", "l2_block_number", "submission_type"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("sync_status");
}
