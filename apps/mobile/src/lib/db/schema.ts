export const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS _local_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  )
`

export const CREATE_SHOPPING_LISTS_TABLE = `
  CREATE TABLE IF NOT EXISTS local_shopping_lists (
    id TEXT PRIMARY KEY,
    remote_id TEXT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    budget REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    archived_at TEXT,
    completed_at TEXT,
    sync_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )
`

export const CREATE_SHOPPING_LIST_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS local_shopping_list_items (
    id TEXT PRIMARY KEY,
    remote_id TEXT,
    list_id TEXT NOT NULL,
    remote_list_id TEXT,
    user_id TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT NOT NULL,
    brand TEXT,
    quantity REAL NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,
    bought INTEGER NOT NULL DEFAULT 0,
    sync_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )
`

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_local_lists_remote_id ON local_shopping_lists(remote_id)`,
  `CREATE INDEX IF NOT EXISTS idx_local_lists_user_id ON local_shopping_lists(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_local_lists_sync_status ON local_shopping_lists(sync_status)`,
  `CREATE INDEX IF NOT EXISTS idx_local_items_list_id ON local_shopping_list_items(list_id)`,
  `CREATE INDEX IF NOT EXISTS idx_local_items_remote_id ON local_shopping_list_items(remote_id)`,
  `CREATE INDEX IF NOT EXISTS idx_local_items_sync_status ON local_shopping_list_items(sync_status)`,
  `CREATE INDEX IF NOT EXISTS idx_local_items_deleted_at ON local_shopping_list_items(deleted_at)`,
]
