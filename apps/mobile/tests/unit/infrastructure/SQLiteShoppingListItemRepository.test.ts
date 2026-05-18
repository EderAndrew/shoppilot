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
      if (sql.startsWith('UPDATE local_shopping_list_items SET updated_at')) {
        const localId = params[params.length - 1] as string
        const row = rows.find((r) => r.id === localId)
        if (row) {
          const setMatch = sql.match(/SET (.+?) WHERE/)?.[1]
          if (setMatch) {
            const columns = setMatch.split(', ').map((s) => s.split(' = ?')[0].trim())
            columns.forEach((col, idx) => {
              row[col] = params[idx]
            })
          }
        }
      }
      if (sql.startsWith('UPDATE local_shopping_list_items SET sync_status')) {
        const localId = params[params.length - 1] as string
        const row = rows.find((r) => r.id === localId)
        if (row) {
          row.sync_status = params[0]
          if (params.length === 4) row.remote_id = params[1]
        }
      }
      if (sql.startsWith('DELETE FROM local_shopping_list_items WHERE id')) {
        const localId = params[0] as string
        rows.splice(0, rows.length, ...rows.filter((r) => r.id !== localId))
      } else if (sql.startsWith('DELETE FROM local_shopping_list_items')) {
        const userId = params[0] as string
        rows.splice(0, rows.length, ...rows.filter((r) => r.user_id !== userId))
      }
      if (sql.includes('deleted_at = ?') && !sql.startsWith('UPDATE local_shopping_list_items SET updated_at')) {
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
    getFirstAsync: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
      if (sql.includes('remote_id = ?')) {
        const remoteId = params[0] as string
        // findByRemoteId keeps deleted_at filter; upsertFromRemote does not
        if (sql.includes('deleted_at IS NULL')) {
          return rows.find((r) => r.remote_id === remoteId && r.deleted_at === null) ?? null
        }
        return rows.find((r) => r.remote_id === remoteId) ?? null
      }
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

  describe('update()', () => {
    it('item com remote_id: armazena sync_status = pending_update', async () => {
      const item = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Arroz',
        quantity: 1,
        unitPrice: 5,
        totalPrice: 5,
      })

      // Simulate item synced to remote (has remote_id)
      const row = (db as unknown as { _rows: Record<string, unknown>[] })._rows.find(
        (r) => r.id === item.id,
      )!
      row.remote_id = 'remote-456'
      row.sync_status = 'synced'

      const updated = await repo.update(item.id, { quantity: 2, syncStatus: 'pending_update' })

      expect(updated.syncStatus).toBe('pending_update')
      expect(updated.quantity).toBe(2)
    })

    it('item sem remote_id: mantém sync_status = pending_create', async () => {
      const item = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Feijão',
        quantity: 1,
        unitPrice: 8,
        totalPrice: 8,
      })

      const updated = await repo.update(item.id, { quantity: 3, syncStatus: 'pending_create' })

      expect(updated.syncStatus).toBe('pending_create')
      expect(updated.quantity).toBe(3)
    })
  })

  describe('upsertFromRemote()', () => {
    it('não sobrescreve item com sync_status !== synced', async () => {
      const item = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Arroz',
        quantity: 1,
        unitPrice: 5,
        totalPrice: 5,
      })

      // Simulate item with remote_id but still pending
      const rows = (db as unknown as { _rows: Record<string, unknown>[] })._rows
      const row = rows.find((r) => r.id === item.id)!
      row.remote_id = 'remote-item-1'
      // sync_status stays 'pending_create'

      const result = await repo.upsertFromRemote(
        {
          remoteId: 'remote-item-1',
          remoteListId: 'remote-list-1',
          userId: 'user-A',
          productName: 'Nome Diferente',
          quantity: 99,
          unitPrice: 100,
          totalPrice: 9900,
          bought: false,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
        'local-list-1',
      )

      // Original data preserved
      expect(result.productName).toBe('Arroz')
      expect(result.quantity).toBe(1)
      expect(result.syncStatus).toBe('pending_create')
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

  describe('softDelete()', () => {
    it('marca deleted_at e sync_status = pending_delete', async () => {
      const item = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Arroz',
        quantity: 1,
        unitPrice: 5,
        totalPrice: 5,
      })

      await repo.softDelete(item.id)

      const rows = (db as unknown as { _rows: Record<string, unknown>[] })._rows
      const row = rows.find((r) => r.id === item.id)
      expect(row?.deleted_at).not.toBeNull()
      expect(row?.sync_status).toBe('pending_delete')
    })

    it('findByListId exclui itens com soft-delete', async () => {
      const a = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Arroz',
        quantity: 1,
        unitPrice: 5,
        totalPrice: 5,
      })
      await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Feijão',
        quantity: 1,
        unitPrice: 8,
        totalPrice: 8,
      })

      await repo.softDelete(a.id)

      const items = await repo.findByListId('list-1')
      expect(items).toHaveLength(1)
      expect(items[0].productName).toBe('Feijão')
    })
  })

  describe('hardDelete()', () => {
    it('remove o registro completamente', async () => {
      const item = await repo.create({
        listId: 'list-1',
        userId: 'user-A',
        productName: 'Leite',
        quantity: 1,
        unitPrice: 4,
        totalPrice: 4,
      })

      await repo.hardDelete(item.id)

      const rows = (db as unknown as { _rows: Record<string, unknown>[] })._rows
      const row = rows.find((r) => r.id === item.id)
      expect(row).toBeUndefined()
    })
  })
})
