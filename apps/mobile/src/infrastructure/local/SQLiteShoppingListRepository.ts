import type { SQLiteDatabase } from 'expo-sqlite'

import type { ShoppingListStatus } from '@shop-pilot/shared/domain-types/shopping'

import type { CreateShoppingListInput } from '@/application/ports/ShoppingListRepository'

import {
  itemRowToRecord,
  listRowToRecord,
  type ItemRow,
  type ListRow,
  type LocalItemRecord,
  type LocalListRecord,
} from './localDbMapper'
import type { SyncStatus } from './sync.types'

export type UpdateListFields = {
  name?: string
  budget?: number
  status?: ShoppingListStatus
  archivedAt?: string | null
  completedAt?: string | null
  syncStatus?: SyncStatus
}

export type UpsertFromRemoteListInput = {
  remoteId: string
  userId: string
  name: string
  budget: number
  status: ShoppingListStatus
  archivedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

export class SQLiteShoppingListRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findAll(userId: string): Promise<LocalListRecord[]> {
    const rows = await this.db.getAllAsync<ListRow>(
      'SELECT * FROM local_shopping_lists WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [userId],
    )
    return rows.map(listRowToRecord)
  }

  async findById(id: string): Promise<LocalListRecord | null> {
    const row = await this.db.getFirstAsync<ListRow>(
      'SELECT * FROM local_shopping_lists WHERE id = ?',
      [id],
    )
    return row ? listRowToRecord(row) : null
  }

  async findByRemoteId(remoteId: string): Promise<LocalListRecord | null> {
    const row = await this.db.getFirstAsync<ListRow>(
      'SELECT * FROM local_shopping_lists WHERE remote_id = ?',
      [remoteId],
    )
    return row ? listRowToRecord(row) : null
  }

  async create(input: CreateShoppingListInput, userId: string): Promise<LocalListRecord> {
    const now = new Date().toISOString()
    const id = globalThis.crypto.randomUUID()
    await this.db.runAsync(
      `INSERT INTO local_shopping_lists
        (id, user_id, name, budget, status, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', 'pending_create', ?, ?)`,
      [id, userId, input.name.trim(), input.budget, now, now],
    )
    return (await this.findById(id))!
  }

  async update(localId: string, fields: UpdateListFields): Promise<LocalListRecord> {
    const now = new Date().toISOString()
    const setParts: string[] = ['updated_at = ?']
    const params: (string | number | null)[] = [now]

    if (fields.name !== undefined) { setParts.push('name = ?'); params.push(fields.name) }
    if (fields.budget !== undefined) { setParts.push('budget = ?'); params.push(fields.budget) }
    if (fields.status !== undefined) { setParts.push('status = ?'); params.push(fields.status) }
    if (fields.archivedAt !== undefined) { setParts.push('archived_at = ?'); params.push(fields.archivedAt) }
    if (fields.completedAt !== undefined) { setParts.push('completed_at = ?'); params.push(fields.completedAt) }
    if (fields.syncStatus !== undefined) { setParts.push('sync_status = ?'); params.push(fields.syncStatus) }

    params.push(localId)
    await this.db.runAsync(
      `UPDATE local_shopping_lists SET ${setParts.join(', ')} WHERE id = ?`,
      params,
    )
    return (await this.findById(localId))!
  }

  async softDelete(localId: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db.runAsync(
      'UPDATE local_shopping_lists SET deleted_at = ?, sync_status = ?, updated_at = ? WHERE id = ?',
      [now, 'pending_delete', now, localId],
    )
  }

  async updateSyncStatus(localId: string, status: SyncStatus, remoteId?: string): Promise<void> {
    const now = new Date().toISOString()
    if (remoteId !== undefined) {
      await this.db.runAsync(
        'UPDATE local_shopping_lists SET sync_status = ?, remote_id = ?, updated_at = ? WHERE id = ?',
        [status, remoteId, now, localId],
      )
    } else {
      await this.db.runAsync(
        'UPDATE local_shopping_lists SET sync_status = ?, updated_at = ? WHERE id = ?',
        [status, now, localId],
      )
    }
  }

  async upsertFromRemote(record: UpsertFromRemoteListInput): Promise<LocalListRecord> {
    const existing = await this.findByRemoteId(record.remoteId)

    if (existing) {
      if (existing.syncStatus !== 'synced') return existing
      await this.db.runAsync(
        `UPDATE local_shopping_lists
           SET name = ?, budget = ?, status = ?, archived_at = ?, completed_at = ?, updated_at = ?
         WHERE id = ?`,
        [record.name, record.budget, record.status,
          record.archivedAt ?? null, record.completedAt ?? null,
          record.updatedAt, existing.id],
      )
      return (await this.findById(existing.id))!
    }

    const id = globalThis.crypto.randomUUID()
    await this.db.runAsync(
      `INSERT INTO local_shopping_lists
        (id, remote_id, user_id, name, budget, status, archived_at, completed_at, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
      [id, record.remoteId, record.userId, record.name, record.budget,
        record.status, record.archivedAt ?? null, record.completedAt ?? null,
        record.createdAt, record.updatedAt],
    )
    return (await this.findById(id))!
  }

  async listActive(userId: string): Promise<LocalListRecord[]> {
    const rows = await this.db.getAllAsync<ListRow>(
      `SELECT * FROM local_shopping_lists
       WHERE user_id = ? AND status != 'archived' AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [userId],
    )
    return rows.map(listRowToRecord)
  }

  async listArchived(userId: string): Promise<LocalListRecord[]> {
    const rows = await this.db.getAllAsync<ListRow>(
      `SELECT * FROM local_shopping_lists
       WHERE user_id = ? AND status = 'archived' AND deleted_at IS NULL
       ORDER BY archived_at DESC`,
      [userId],
    )
    return rows.map(listRowToRecord)
  }

  async getDetails(listId: string): Promise<{ list: LocalListRecord; items: LocalItemRecord[] } | null> {
    const list = await this.findById(listId)
    if (!list) return null

    const itemRows = await this.db.getAllAsync<ItemRow>(
      `SELECT * FROM local_shopping_list_items
       WHERE list_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [listId],
    )
    return { list, items: itemRows.map(itemRowToRecord) }
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM local_shopping_lists WHERE user_id = ?', [userId])
  }
}
