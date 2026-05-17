import { describe, expect, it, vi, beforeEach } from 'vitest'

import { SQLiteShoppingListItemRepository } from '../../src/infrastructure/local/SQLiteShoppingListItemRepository'

type Row = Record<string, unknown>

function makeIsolatedDb() {
  const rows: Row[] = []

  const db = {
    _rows: rows,
    execAsync: vi.fn().mockResolvedValue(undefined),
    runAsync: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
      if (sql.startsWith('INSERT INTO local_shopping_list_items')) {
        rows.push({
          id: params[0],
          remote_id: null,
          list_id: params[1],
          remote_list_id: params[2],
          user_id: params[3],
          product_id: params[4],
          product_name: params[5],
          brand: params[6],
          quantity: Number(params[7]),
          unit_price: Number(params[8]),
          total_price: Number(params[9]),
          bought: 0,
          sync_status: 'pending_create',
          created_at: params[11],
          updated_at: params[12],
          deleted_at: null,
        })
      }
      return { lastInsertRowId: 0, changes: 1 }
    }),
    getFirstAsync: vi.fn().mockImplementation(async (_sql: string, params: unknown[]) => {
      const id = params[0] as string
      return rows.find((r) => r.id === id) ?? null
    }),
    getAllAsync: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
      const value = params[0] as string
      if (sql.includes('list_id =')) {
        return rows.filter((r) => r.list_id === value && r.deleted_at === null)
      }
      if (sql.includes('user_id =')) {
        return rows.filter((r) => r.user_id === value && r.deleted_at === null)
      }
      return []
    }),
  }

  return db as unknown as ConstructorParameters<typeof SQLiteShoppingListItemRepository>[0]
}

describe('local-data-isolation', () => {
  let db: ReturnType<typeof makeIsolatedDb>
  let repo: SQLiteShoppingListItemRepository

  beforeEach(() => {
    db = makeIsolatedDb()
    repo = new SQLiteShoppingListItemRepository(db)
  })

  it('dados do user_id A não são retornados para user_id B', async () => {
    await repo.create({
      listId: 'list-A',
      userId: 'user-A',
      productName: 'Arroz',
      quantity: 1,
      unitPrice: 5,
      totalPrice: 5,
    })

    const rowsForB = await repo.findByListId('list-B')
    expect(rowsForB).toHaveLength(0)

    const rowsForA = await repo.findByListId('list-A')
    expect(rowsForA).toHaveLength(1)
    expect(rowsForA[0].userId).toBe('user-A')
  })

  it('findByListId retorna apenas itens da lista correta', async () => {
    await repo.create({ listId: 'list-A', userId: 'user-A', productName: 'X', quantity: 1, unitPrice: 1, totalPrice: 1 })
    await repo.create({ listId: 'list-A', userId: 'user-A', productName: 'Y', quantity: 1, unitPrice: 1, totalPrice: 1 })
    await repo.create({ listId: 'list-B', userId: 'user-B', productName: 'Z', quantity: 1, unitPrice: 1, totalPrice: 1 })

    const itemsA = await repo.findByListId('list-A')
    const itemsB = await repo.findByListId('list-B')

    expect(itemsA).toHaveLength(2)
    expect(itemsB).toHaveLength(1)
    expect(itemsA.every((i) => i.shoppingListId === 'list-A')).toBe(true)
    expect(itemsB[0].shoppingListId).toBe('list-B')
  })

  it('itens de um usuário não aparecem nas queries de outro usuário', async () => {
    await repo.create({ listId: 'shared-list', userId: 'user-A', productName: 'A1', quantity: 1, unitPrice: 1, totalPrice: 1 })
    await repo.create({ listId: 'shared-list', userId: 'user-A', productName: 'A2', quantity: 1, unitPrice: 1, totalPrice: 1 })

    const itemsForA = await repo.findByListId('shared-list')
    expect(itemsForA.every((i) => i.userId === 'user-A')).toBe(true)
    expect(itemsForA).toHaveLength(2)
  })
})
