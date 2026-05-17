import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LocalFirstShoppingListRepository } from '../../../src/infrastructure/local/LocalFirstShoppingListRepository'

// Mock list DB row that SQLiteShoppingListRepository can use
const mockListRow = {
  id: 'local-list-1',
  remote_id: 'remote-list-1',
  user_id: 'user-A',
  name: 'Lista do Mês',
  budget: 500,
  status: 'active',
  archived_at: null,
  completed_at: null,
  sync_status: 'synced',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
}

function makeListDb(row: typeof mockListRow | null = mockListRow) {
  return {
    execAsync: vi.fn().mockResolvedValue(undefined),
    runAsync: vi.fn().mockResolvedValue({ lastInsertRowId: 0, changes: 1 }),
    getFirstAsync: vi.fn().mockImplementation(async (_sql: string, params: unknown[]) => {
      // findById: WHERE id = ?
      if (!_sql.includes('remote_id') && params[0] === (row?.id ?? '__not_found__')) return row
      // findByRemoteId: WHERE remote_id = ?
      if (_sql.includes('remote_id = ?') && params[0] === (row?.remote_id ?? '__not_found__')) return row
      return null
    }),
    getAllAsync: vi.fn().mockResolvedValue([]), // no items in list
  }
}

vi.mock('@/lib/db/database', () => ({
  getDatabaseInstance: vi.fn(),
}))

vi.mock('@/infrastructure/local/networkService', () => ({
  isConnected: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/infrastructure/repositories/supabaseRepositoryUtils', () => ({
  requireCurrentUserId: vi.fn().mockResolvedValue('user-A'),
}))

describe('LocalFirstShoppingListRepository', () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  }
  const mockAuthRepo = {}

  const mockSupabaseRepo = {
    getDetails: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    listActive: vi.fn().mockResolvedValue([]),
    listArchived: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    complete: vi.fn(),
    archive: vi.fn(),
  }

  let repo: LocalFirstShoppingListRepository

  beforeEach(async () => {
    vi.clearAllMocks()

    const { getDatabaseInstance } = await import('@/lib/db/database')
    vi.mocked(getDatabaseInstance).mockReturnValue(makeListDb() as never)

    repo = new LocalFirstShoppingListRepository(
      mockSupabaseRepo as never,
      mockAuthRepo as never,
      mockQueryClient as never,
    )
  })

  describe('getDetails()', () => {
    it('retorna dados do SQLite sem chamar o Supabase quando disponível', async () => {
      mockSupabaseRepo.getDetails.mockRejectedValue(new Error('Sem internet'))

      const result = await repo.getDetails('local-list-1')

      expect(result).not.toBeNull()
      expect(result?.list.name).toBe('Lista do Mês')
      expect(mockSupabaseRepo.getDetails).not.toHaveBeenCalled()
    })

    it('usa o Supabase como fallback quando SQLite não tem a lista', async () => {
      const { getDatabaseInstance } = await import('@/lib/db/database')
      vi.mocked(getDatabaseInstance).mockReturnValue(makeListDb(null) as never)

      // Force new lazy init by creating a fresh repo with empty SQLite
      repo = new LocalFirstShoppingListRepository(
        mockSupabaseRepo as never,
        mockAuthRepo as never,
        mockQueryClient as never,
      )
      mockSupabaseRepo.getDetails.mockResolvedValue({ list: mockListRow, items: [] })

      const result = await repo.getDetails('unknown-id')

      expect(result).not.toBeNull()
      expect(mockSupabaseRepo.getDetails).toHaveBeenCalledWith('unknown-id')
    })
  })
})
