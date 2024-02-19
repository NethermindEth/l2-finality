import { Env, getEnv } from "../tools/Env";
import { getTestConfig } from "../config/config.test";
import { Database } from "./Database";
import Logger from "../tools/Logger";
import { Knex } from "knex";
import { Config } from "../config";

export async function getTestDatabase(): Promise<Knex> {
  const env: Env = getEnv();
  const config: Config = getTestConfig(env);
  const database = new Database(config.database, new Logger());
  await database.rollbackAll();
  await database.migrateToLatest();
  return database.getKnex();
}
