import type { SQLiteDatabase } from 'expo-sqlite'

import { runMigrations } from './migrations'

export type LocalDatabase = SQLiteDatabase

let _instance: SQLiteDatabase | null = null

export function getDatabaseInstance(): SQLiteDatabase {
  if (!_instance) throw new Error('SQLite database not initialized. Ensure SQLiteProvider is mounted.')
  return _instance
}

export async function initDatabase(db: LocalDatabase): Promise<void> {
  _instance = db
  await runMigrations(db)
}
