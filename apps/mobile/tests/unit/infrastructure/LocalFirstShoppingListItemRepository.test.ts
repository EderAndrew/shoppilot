import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LocalFirstShoppingListItemRepository } from '../../../src/infrastructure/local/LocalFirstShoppingListItemRepository'

vi.mock('@/lib/db/database', () => ({
  getDatabaseInstance: vi.fn(),
}))

vi.mock('@/infrastructure/local/networkService', () => ({
  isConnected: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/infrastructure/repositories/supabaseRepositoryUtils', () => ({
  requireCurrentUserId: vi.fn().mockResolvedValue('user-A'),
}))

function makeItemDb() {
  const rows: Record<string, unknown>[] = []

  return {
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
      if (sql.startsWith('DELETE FROM local_shopping_list_items WHERE id')) {
        const localId = params[0] as string
        rows.splice(0, rows.length, ...rows.filter((r) => r.id !== localId))
      }
      if (sql.includes('deleted_at = ?')) {
        const localId = params[params.length - 1] as string
        const row = rows.find((r) => r.id === localId)
        if (row) {
          row.deleted_at = params[0]
          row.sync_status = 'pending_delete'
          row.updated_at = params[1]
        }
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
}

describe('LocalFirstShoppingListItemRepository', () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  }
  const mockAuthRepo = {}

  const mockSupabaseRepo = {
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn().mockResolvedValue(undefined),
    setBought: vi.fn(),
    listByShoppingList: vi.fn().mockResolvedValue([]),
  }

  let db: ReturnType<typeof makeItemDb>
  let repo: LocalFirstShoppingListItemRepository

  beforeEach(async () => {
    vi.clearAllMocks()

    db = makeItemDb()
    const { getDatabaseInstance } = await import('@/lib/db/database')
    vi.mocked(getDatabaseInstance).mockReturnValue(db as never)

    repo = new LocalFirstShoppingListItemRepository(
      mockSupabaseRepo as never,
      mockAuthRepo as never,
      mockQueryClient as never,
    )
  })

  describe('remove()', () => {
    it('item sem remote_id: hard delete sem chamar Supabase', async () => {
      const item = await repo.add({
        shoppingListId: 'list-1',
        productId: 'prod-1',
        productName: 'Arroz',
        quantity: 1,
        unitPrice: 5,
        totalPrice: 5,
      })

      await repo.remove(item.id)

      const row = db._rows.find((r) => r.id === item.id)
      expect(row).toBeUndefined()
      expect(mockSupabaseRepo.remove).not.toHaveBeenCalled()
    })

    it('item com remote_id: soft delete + pending_delete, sem chamar Supabase (offline)', async () => {
      const item = await repo.add({
        shoppingListId: 'list-1',
        productId: 'prod-2',
        productName: 'Feijão',
        quantity: 1,
        unitPrice: 8,
        totalPrice: 8,
      })

      const row = db._rows.find((r) => r.id === item.id)!
      row.remote_id = 'remote-item-456'
      row.sync_status = 'synced'

      await repo.remove(item.id)

      const updatedRow = db._rows.find((r) => r.id === item.id)
      expect(updatedRow?.deleted_at).not.toBeNull()
      expect(updatedRow?.sync_status).toBe('pending_delete')
      expect(mockSupabaseRepo.remove).not.toHaveBeenCalled()
    })
  })
})
