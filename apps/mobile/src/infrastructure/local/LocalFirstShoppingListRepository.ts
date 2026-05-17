import type {
  ArchiveShoppingListInput,
  CompleteShoppingListInput,
  CreateShoppingListInput,
  ShoppingListDetails,
  ShoppingListRecord,
  ShoppingListRepository,
} from '@/application/ports/ShoppingListRepository'
import type { SupabaseShoppingListRepository } from '@/infrastructure/repositories/SupabaseShoppingListRepository'
import { getDatabaseInstance } from '@/lib/db/database'

import { SQLiteShoppingListRepository } from './SQLiteShoppingListRepository'

export class LocalFirstShoppingListRepository implements ShoppingListRepository {
  private _sqliteRepo: SQLiteShoppingListRepository | null = null

  constructor(
    private readonly supabaseRepo: SupabaseShoppingListRepository,
  ) {}

  private get sqliteRepo(): SQLiteShoppingListRepository {
    if (!this._sqliteRepo) {
      this._sqliteRepo = new SQLiteShoppingListRepository(getDatabaseInstance())
    }
    return this._sqliteRepo
  }

  async getDetails(listId: string): Promise<ShoppingListDetails | null> {
    try {
      // Try local ID first
      const byLocalId = await this.sqliteRepo.getDetails(listId)
      if (byLocalId) return byLocalId

      // Try remote ID (Phase 2: listId is likely the Supabase UUID)
      const byRemoteId = await this.sqliteRepo.findByRemoteId(listId)
      if (byRemoteId) {
        const result = await this.sqliteRepo.getDetails(byRemoteId.localId)
        if (result) return result
      }
    } catch {
      // SQLite not ready yet — fall through to Supabase
    }

    return this.supabaseRepo.getDetails(listId)
  }

  // Phase 2: delegated to Supabase. Phase 5 (T028) adds SQLite-first behavior.

  async create(input: CreateShoppingListInput): Promise<ShoppingListRecord> {
    return this.supabaseRepo.create(input)
  }

  async list(): Promise<ShoppingListRecord[]> {
    return this.supabaseRepo.list()
  }

  async listActive(): Promise<ShoppingListRecord[]> {
    return this.supabaseRepo.listActive()
  }

  async listArchived(): Promise<ShoppingListRecord[]> {
    return this.supabaseRepo.listArchived()
  }

  async complete(input: CompleteShoppingListInput): Promise<ShoppingListRecord> {
    return this.supabaseRepo.complete(input)
  }

  async archive(input: ArchiveShoppingListInput): Promise<ShoppingListRecord> {
    return this.supabaseRepo.archive(input)
  }
}
