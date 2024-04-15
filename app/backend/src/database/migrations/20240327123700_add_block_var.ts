import { Knex } from "knex";

function updateBlockValueColumns(table: any) {
  table.dropColumn("value");
  table.dropColumn("gas_fees");
  table.dropColumn("gas_fees_usd");
  table.dropColumn("block_reward");
  table.dropColumn("block_reward_usd");

  table.jsonb("value_by_contract").notNullable();
  table.jsonb("value_by_type").notNullable();
}

function revertBlockValueColumns(table: any) {
  table.dropColumn("value_by_contract");
  table.dropColumn("value_by_type");

  table.jsonb("value").notNullable().defaultTo({});
  table.bigInteger("gas_fees").defaultTo(0).notNullable();
  table.decimal("gas_fees_usd", 18, 4).notNullable().defaultTo(0);
  table.bigInteger("block_reward").defaultTo(0).notNullable();
  table.decimal("block_reward_usd", 18, 4).notNullable().defaultTo(0);
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("optimism_blocks", updateBlockValueColumns);
  await knex.schema.alterTable(
    "polygon_zk_evm_blocks",
    updateBlockValueColumns,
  );
  await knex.schema.alterTable("starknet_blocks", updateBlockValueColumns);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("optimism_blocks", revertBlockValueColumns);
  await knex.schema.alterTable(
    "polygon_zk_evm_blocks",
    revertBlockValueColumns,
  );
  await knex.schema.alterTable("starknet_blocks", revertBlockValueColumns);
}
