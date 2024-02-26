import type { Knex } from "knex";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { FsMigrations } from "knex/lib/migrations/migrate/sources/fs-migrations.js";

type Migration = Knex.Migration;
type MigrationSource = Knex.MigrationSource<Migration>;

export class MigrationsResolver
  extends FsMigrations
  implements MigrationSource
{
  constructor(migrationDirectory: string) {
    const sortDirsSeparately = false;
    super([migrationDirectory], sortDirsSeparately, []);
  }

  getMigrationName(migration: object): string {
    const name = super.getMigrationName(migration) as string;
    return name.replace(new RegExp(`.(ts|js)$`), "");
  }

  async getMigrations(loadExtensions: readonly string[]): Promise<Migration[]> {
    // We need to set the extension to empty string, otherwise the call to super.getMigrations() fails.
    loadExtensions = [""];

    return super.getMigrations(loadExtensions) as Promise<Migration[]>;
  }

  async getMigration(migration: object): Promise<Migration> {
    return super.getMigration(migration) as Promise<Migration>;
  }
}
