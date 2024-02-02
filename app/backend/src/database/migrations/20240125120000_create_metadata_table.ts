import { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.createTable("metadata", function (table) {
    table.string("job_name").notNullable();
    table.string("metric_name").notNullable();
    table.float("value").notNullable();
    table.primary(["job_name", "metric_name"]);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex) {
  await knex.schema.dropTable("metadata");
}
