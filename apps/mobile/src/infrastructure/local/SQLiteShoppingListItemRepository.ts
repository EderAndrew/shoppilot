import type { SQLiteDatabase } from 'expo-sqlite'

import { createAppError } from '@/shared/errors/appError'
import { logger } from '@/shared/logging/logger'

import { itemRowToRecord, type ItemRow, type LocalItemRecord } from './localDbMapper'
import type { SyncStatus } from './sync.types'

export type CreateItemInput = {
  listId: string
  remoteListId?: string | null
  userId: string
  productId?: string | null
  productName: string
  brand?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type UpdateItemFields = {
  productName?: string
  brand?: string | null
  quantity?: number
  unitPrice?: number
  totalPrice?: number
  bought?: boolean
  syncStatus?: SyncStatus
}

export type UpsertFromRemoteItemInput = {
  remoteId: string
  remoteListId: string
  userId: string
  productId?: string | null
  productName: string
  brand?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  bought: boolean
  createdAt: string
  updatedAt: string
}

export class SQLiteShoppingListItemRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async findByListId(listId: string): Promise<LocalItemRecord[]> {
    const rows = await this.db.getAllAsync<ItemRow>(
      `SELECT * FROM local_shopping_list_items
       WHERE list_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [listId],
    )
    return rows.map(itemRowToRecord)
  }

  async findById(id: string): Promise<LocalItemRecord | null> {
    const row = await this.db.getFirstAsync<ItemRow>(
      'SELECT * FROM local_shopping_list_items WHERE id = ?',
      [id],
    )
    return row ? itemRowToRecord(row) : null
  }

  async findByRemoteId(remoteId: string): Promise<LocalItemRecord | null> {
    const row = await this.db.getFirstAsync<ItemRow>(
      'SELECT * FROM local_shopping_list_items WHERE remote_id = ? AND deleted_at IS NULL',
      [remoteId],
    )
    return row ? itemRowToRecord(row) : null
  }

  async create(input: CreateItemInput): Promise<LocalItemRecord> {
    try {
      const now = new Date().toISOString()
      const id = globalThis.crypto.randomUUID()
      await this.db.runAsync(
        `INSERT INTO local_shopping_list_items
          (id, list_id, remote_list_id, user_id, product_id, product_name, brand,
           quantity, unit_price, total_price, bought, sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending_create', ?, ?)`,
        [id, input.listId, input.remoteListId ?? null, input.userId,
          input.productId ?? null, input.productName, input.brand ?? null,
          input.quantity, input.unitPrice, input.totalPrice, now, now],
      )
      return (await this.findById(id))!
    } catch (err) {
      logger.error('SQLiteShoppingListItemRepository.create failed', { listId: input.listId })
      throw createAppError({ category: 'unexpected', message: 'Algo deu errado. Tente novamente.', cause: err })
    }
  }

  async update(localId: string, fields: UpdateItemFields): Promise<LocalItemRecord> {
    try {
      const now = new Date().toISOString()
      const setParts: string[] = ['updated_at = ?']
      const params: (string | number | null)[] = [now]

      if (fields.productName !== undefined) { setParts.push('product_name = ?'); params.push(fields.productName) }
      if (fields.brand !== undefined) { setParts.push('brand = ?'); params.push(fields.brand) }
      if (fields.quantity !== undefined) { setParts.push('quantity = ?'); params.push(fields.quantity) }
      if (fields.unitPrice !== undefined) { setParts.push('unit_price = ?'); params.push(fields.unitPrice) }
      if (fields.totalPrice !== undefined) { setParts.push('total_price = ?'); params.push(fields.totalPrice) }
      if (fields.bought !== undefined) { setParts.push('bought = ?'); params.push(fields.bought ? 1 : 0) }
      if (fields.syncStatus !== undefined) { setParts.push('sync_status = ?'); params.push(fields.syncStatus) }

      params.push(localId)
      await this.db.runAsync(
        `UPDATE local_shopping_list_items SET ${setParts.join(', ')} WHERE id = ?`,
        params,
      )
      return (await this.findById(localId))!
    } catch (err) {
      logger.error('SQLiteShoppingListItemRepository.update failed', { localId })
      throw createAppError({ category: 'unexpected', message: 'Algo deu errado. Tente novamente.', cause: err })
    }
  }

  async softDelete(localId: string): Promise<void> {
    try {
      const now = new Date().toISOString()
      await this.db.runAsync(
        `UPDATE local_shopping_list_items
         SET deleted_at = ?, sync_status = 'pending_delete', updated_at = ?
         WHERE id = ?`,
        [now, now, localId],
      )
    } catch (err) {
      logger.error('SQLiteShoppingListItemRepository.softDelete failed', { localId })
      throw createAppError({ category: 'unexpected', message: 'Algo deu errado. Tente novamente.', cause: err })
    }
  }

  async hardDelete(localId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'DELETE FROM local_shopping_list_items WHERE id = ?',
        [localId],
      )
    } catch (err) {
      logger.error('SQLiteShoppingListItemRepository.hardDelete failed', { localId })
      throw createAppError({ category: 'unexpected', message: 'Algo deu errado. Tente novamente.', cause: err })
    }
  }

  async updateSyncStatus(localId: string, status: SyncStatus, remoteId?: string): Promise<void> {
    try {
      const now = new Date().toISOString()
      if (remoteId !== undefined) {
        await this.db.runAsync(
          'UPDATE local_shopping_list_items SET sync_status = ?, remote_id = ?, updated_at = ? WHERE id = ?',
          [status, remoteId, now, localId],
        )
      } else {
        await this.db.runAsync(
          'UPDATE local_shopping_list_items SET sync_status = ?, updated_at = ? WHERE id = ?',
          [status, now, localId],
        )
      }
    } catch (err) {
      logger.error('SQLiteShoppingListItemRepository.updateSyncStatus failed', { localId, status })
      throw createAppError({ category: 'unexpected', message: 'Algo deu errado. Tente novamente.', cause: err })
    }
  }

  async countPendingSync(userId: string): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM local_shopping_list_items
       WHERE user_id = ? AND sync_status != 'synced' AND deleted_at IS NULL`,
      [userId],
    )
    return result?.count ?? 0
  }

  async upsertFromRemote(
    record: UpsertFromRemoteItemInput,
    localListId: string,
  ): Promise<LocalItemRecord> {
    try {
      const existing = await this.db.getFirstAsync<ItemRow>(
        'SELECT * FROM local_shopping_list_items WHERE remote_id = ?',
        [record.remoteId],
      )

      if (existing) {
        if (existing.deleted_at !== null) return itemRowToRecord(existing)
        if (existing.sync_status !== 'synced') return itemRowToRecord(existing)
        await this.db.runAsync(
          `UPDATE local_shopping_list_items
             SET list_id = ?, product_name = ?, brand = ?, quantity = ?, unit_price = ?, total_price = ?,
                 bought = ?, updated_at = ?
           WHERE id = ?`,
          [localListId, record.productName, record.brand ?? null, record.quantity,
            record.unitPrice, record.totalPrice, record.bought ? 1 : 0,
            record.updatedAt, existing.id],
        )
        return (await this.findById(existing.id))!
      }

      const id = globalThis.crypto.randomUUID()
      await this.db.runAsync(
        `INSERT INTO local_shopping_list_items
          (id, remote_id, list_id, remote_list_id, user_id, product_id, product_name, brand,
           quantity, unit_price, total_price, bought, sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        [id, record.remoteId, localListId, record.remoteListId, record.userId,
          record.productId ?? null, record.productName, record.brand ?? null,
          record.quantity, record.unitPrice, record.totalPrice,
          record.bought ? 1 : 0, record.createdAt, record.updatedAt],
      )
      return (await this.findById(id))!
    } catch (err) {
      logger.error('SQLiteShoppingListItemRepository.upsertFromRemote failed', { remoteId: record.remoteId })
      throw createAppError({ category: 'unexpected', message: 'Algo deu errado. Tente novamente.', cause: err })
    }
  }

  async deleteAllForUser(userId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'DELETE FROM local_shopping_list_items WHERE user_id = ?',
        [userId],
      )
    } catch (err) {
      logger.error('SQLiteShoppingListItemRepository.deleteAllForUser failed', { userId })
      throw createAppError({ category: 'unexpected', message: 'Algo deu errado. Tente novamente.', cause: err })
    }
  }
}
