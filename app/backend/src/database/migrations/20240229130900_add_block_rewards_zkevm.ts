import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("polygon_zk_evm_blocks", function (table) {
    table.bigInteger("gas_fees").notNullable();
    table.decimal("gas_fees_usd", 18, 4).notNullable().defaultTo(0);
    table.bigInteger("block_reward").notNullable();
    table.decimal("block_reward_usd", 18, 4).notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("polygon_zk_evm_blocks", function (table) {
    table.dropColumn("gas_fees");
    table.dropColumn("gas_fees_usd");
    table.dropColumn("block_reward");
    table.dropColumn("block_reward_usd");
  });
}
