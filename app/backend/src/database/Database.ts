import KnexConstructor, { Knex } from "knex";
import path from "path";
import Logger from "../tools/Logger";
import { DatabaseConfig } from "../config/Config";

export class Database {
  private readonly knex: Knex;
  private readonly logger: Logger;
  private migrated: boolean = false;

  constructor(
    private config: DatabaseConfig,
    logger: Logger,
  ) {
    this.knex = KnexConstructor({
      client: config.client,
      connection: config.connection,
      migrations: {
        directory: path.join(__dirname, "migrations"),
      },
      pool: config.connectionPoolSize,
    });

    this.logger = logger.for("Database");
  }

  public getKnex(): Knex {
    if (!this.migrated) {
      throw new Error("Migrate the database before using it");
    }
    return this.knex;
  }

  getStatus() {
    return { migrated: this.migrated };
  }

  public async connect(): Promise<void> {
    try {
      await this.knex.raw("select 1");
      this.logger.info("Database connection successful");
    } catch (error) {
      this.logger.error("Database connection failed", error);
      throw error;
    }
  }

  public async migrateToLatest(): Promise<void> {
    try {
      await this.knex.migrate.latest();
      this.migrated = true;
      this.logger.info("Migrations are up to date");
    } catch (error) {
      this.logger.error("Migration failed", error);
      throw error;
    }
  }

  public async rollbackLastMigration(): Promise<void> {
    try {
      await this.knex.migrate.rollback();
      this.logger.info("Last migration rolled back");
    } catch (error) {
      this.logger.error("Rollback failed", error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.knex.destroy();
    this.logger.info("Database connection closed");
  }

  async rollbackAll() {
    this.migrated = false;
    await this.knex.migrate.rollback(undefined, true);
    this.logger.info("Migrations rollback completed");
  }
}
