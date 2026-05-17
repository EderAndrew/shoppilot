import type { SQLiteDatabase } from 'expo-sqlite'

import {
  CREATE_INDEXES,
  CREATE_MIGRATIONS_TABLE,
  CREATE_SHOPPING_LIST_ITEMS_TABLE,
  CREATE_SHOPPING_LISTS_TABLE,
} from './schema'

type Migration = {
  version: number
  name: string
  up(db: SQLiteDatabase): Promise<void>
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_local_tables',
    async up(db) {
      await db.execAsync(CREATE_SHOPPING_LISTS_TABLE)
      await db.execAsync(CREATE_SHOPPING_LIST_ITEMS_TABLE)
      for (const idx of CREATE_INDEXES) {
        await db.execAsync(idx)
      }
    },
  },
]

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_MIGRATIONS_TABLE)

  const result = await db.getFirstAsync<{ max_version: number | null }>(
    'SELECT MAX(version) as max_version FROM _local_migrations',
  )
  const currentVersion = result?.max_version ?? 0

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await migration.up(db)
      await db.runAsync(
        'INSERT INTO _local_migrations (version, name, applied_at) VALUES (?, ?, ?)',
        [migration.version, migration.name, new Date().toISOString()],
      )
    }
  }
}
