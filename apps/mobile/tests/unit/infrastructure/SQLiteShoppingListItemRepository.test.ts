import { describe, expect, it, vi, beforeEach } from 'vitest'

import { SQLiteShoppingListItemRepository } from '../../../src/infrastructure/local/SQLiteShoppingListItemRepository'

function makeDb() {
  const rows: Record<string, unknown>[] = []

  const db = {
    _rows: rows,
    execAsync: vi.fn().mockResolvedValue(undefined),
    runAsync: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
      if (sql.startsWith('INSERT INTO local_shopping_list_items')) {
        const [id, , , userId, , productName, , quantity, unitPrice, totalPrice, , , createdAt, updatedAt] =
          params as string[]
        rows.push({
          id,
          remote_id: null,
          list_id: params[1],
          remote_list_id: params[2],
          user_id: userId,
          product_id: params[4],
          product_name: productName,
          brand: params[6],
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          total_price: Number(totalPrice),
          bought: 0,
          sync_status: 'pending_create',
          created_at: createdAt,
          updated_at: updatedAt,
          deleted_at: null,
        })
      }
      if (sql.startsWith('UPDATE local_shopping_list_items SET sync_status')) {
        const localId = params[params.length - 1] as string
        const row = rows.find((r) => r.id === localId)
        if (row) {
          row.sync_status = params[0]
          if (params.length === 4) row.remote_id = params[1]
        }
      }
      if (sql.startsWith('DELETE FROM local_shopping_list_items')) {
        const userId = params[0] as string
        rows.splice(0, rows.length, ...rows.filter((r) => r.user_id !== userId))
      }
      return { lastInsertRowId: 0, changes: 1 }
    }),
    getFirstAsync: vi.fn().mockImplementation(async (_sql: string, params: unknown[]) => {
      const id = params[0] as string
      return rows.find((r) => r.id === id) ?? null
    }),
    getAllAsync: vi.fn().mockImplementation(async (_sql: string, params: unknown[]) => {
      const listId = params[0] as string
      return rows.filter((r) => r.list_id === listId && r.deleted_at === null)
    }),
  }
  return db as unknown as ConstructorParameters<typeof SQLiteShoppingListItemRepository>[0]
}

describe('SQLiteShoppingListItemRepository', () => {
  let db: ReturnType<typeof makeDb>
  let repo: SQLiteShoppingListItemRepository

  beforeEach(() => {
    db = makeDb()
    repo = new SQLiteShoppingListItemRepository(db)
  })

  describe('create()', () => {
    it('salva item com sync_status = pending_create e sem remote_id', async () => {
      const item = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Arroz',
        quantity: 2,
        unitPrice: 5.99,
        totalPrice: 11.98,
      })

      expect(item.syncStatus).toBe('pending_create')
      expect(item.remoteId).toBeNull()
      expect(item.productName).toBe('Arroz')
    })

    it('gera UUID local único como id', async () => {
      const a = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Feijão',
        quantity: 1,
        unitPrice: 8,
        totalPrice: 8,
      })
      const b = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Macarrão',
        quantity: 1,
        unitPrice: 3,
        totalPrice: 3,
      })

      expect(a.id).not.toBe(b.id)
    })
  })

  describe('updateSyncStatus()', () => {
    it('atualiza para synced e preenche remote_id', async () => {
      const item = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Leite',
        quantity: 1,
        unitPrice: 4,
        totalPrice: 4,
      })

      // Patch getFirstAsync to return updated row
      ;(db as unknown as { getFirstAsync: ReturnType<typeof vi.fn> }).getFirstAsync
        .mockImplementationOnce(async () => {
          const row = (db as unknown as { _rows: Record<string, unknown>[] })._rows.find(
            (r) => r.id === item.id,
          )
          return row ?? null
        })

      await repo.updateSyncStatus(item.id, 'synced', 'remote-123')

      const rows = (db as unknown as { _rows: Record<string, unknown>[] })._rows
      const updated = rows.find((r) => r.id === item.id)
      expect(updated?.sync_status).toBe('synced')
      expect(updated?.remote_id).toBe('remote-123')
    })
  })
})
