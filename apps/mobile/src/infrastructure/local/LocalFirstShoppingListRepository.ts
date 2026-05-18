import type { QueryClient } from '@tanstack/react-query'

import type { AuthRepository } from '@/application/ports/AuthRepository'
import type {
  ArchiveShoppingListInput,
  CompleteShoppingListInput,
  CreateShoppingListInput,
  ShoppingListDetails,
  ShoppingListRecord,
  ShoppingListRepository,
} from '@/application/ports/ShoppingListRepository'
import { queryKeys } from '@/application/query-keys/queryKeys'
import type { SupabaseShoppingListRepository } from '@/infrastructure/repositories/SupabaseShoppingListRepository'
import { requireCurrentUserId } from '@/infrastructure/repositories/supabaseRepositoryUtils'
import { getDatabaseInstance } from '@/lib/db/database'
import { logger } from '@/shared/logging/logger'

import type { LocalListRecord } from './localDbMapper'
import { isConnected } from './networkService'
import { SQLiteShoppingListItemRepository } from './SQLiteShoppingListItemRepository'
import { SQLiteShoppingListRepository } from './SQLiteShoppingListRepository'

export class LocalFirstShoppingListRepository implements ShoppingListRepository {
  private _sqliteRepo: SQLiteShoppingListRepository | null = null
  private _sqliteItemRepo: SQLiteShoppingListItemRepository | null = null

  constructor(
    private readonly supabaseRepo: SupabaseShoppingListRepository,
    private readonly authRepo: AuthRepository,
    private readonly queryClient: QueryClient,
  ) {}

  private get sqliteRepo(): SQLiteShoppingListRepository {
    if (!this._sqliteRepo) {
      this._sqliteRepo = new SQLiteShoppingListRepository(getDatabaseInstance())
    }
    return this._sqliteRepo
  }

  private get sqliteItemRepo(): SQLiteShoppingListItemRepository {
    if (!this._sqliteItemRepo) {
      this._sqliteItemRepo = new SQLiteShoppingListItemRepository(getDatabaseInstance())
    }
    return this._sqliteItemRepo
  }

  async list(): Promise<ShoppingListRecord[]> {
    const userId = await requireCurrentUserId(this.authRepo)
    try {
      const local = await this.sqliteRepo.findAll(userId)
      if (local.length > 0) return local
    } catch {
      // SQLite not ready
    }
    return this.supabaseRepo.list()
  }

  async listActive(): Promise<ShoppingListRecord[]> {
    const userId = await requireCurrentUserId(this.authRepo)
    try {
      const local = await this.sqliteRepo.listActive(userId)
      if (local.length > 0) return local
    } catch {
      // SQLite not ready
    }
    return this.supabaseRepo.listActive()
  }

  async listArchived(): Promise<ShoppingListRecord[]> {
    const userId = await requireCurrentUserId(this.authRepo)
    try {
      const local = await this.sqliteRepo.listArchived(userId)
      if (local.length > 0) return local
    } catch {
      // SQLite not ready
    }
    return this.supabaseRepo.listArchived()
  }

  async getDetails(listId: string): Promise<ShoppingListDetails | null> {
    try {
      const byLocalId = await this.sqliteRepo.getDetails(listId)
      if (byLocalId) return byLocalId

      const byRemoteId = await this.sqliteRepo.findByRemoteId(listId)
      if (byRemoteId) {
        const result = await this.sqliteRepo.getDetails(byRemoteId.localId)
        if (result) return result
      }
    } catch {
      // SQLite not ready — fall through to Supabase
    }
    return this.supabaseRepo.getDetails(listId)
  }

  async create(input: CreateShoppingListInput): Promise<ShoppingListRecord> {
    const userId = await requireCurrentUserId(this.authRepo)
    const localRecord = await this.sqliteRepo.create(input, userId)
    void this.syncCreate(localRecord, input)
    return localRecord
  }

  async complete(input: CompleteShoppingListInput): Promise<ShoppingListRecord> {
    const now = input.completedAt ?? new Date().toISOString()

    let localList = await this.sqliteRepo.findById(input.listId)
    if (!localList) localList = await this.sqliteRepo.findByRemoteId(input.listId)

    if (!localList) {
      return this.supabaseRepo.complete(input)
    }

    const updated = await this.sqliteRepo.update(localList.id, {
      status: 'completed',
      completedAt: now,
      syncStatus: localList.remoteId ? 'pending_update' : 'pending_create',
    })

    if (localList.remoteId) {
      void this.syncComplete(updated)
    }

    return updated
  }

  async archive(input: ArchiveShoppingListInput): Promise<ShoppingListRecord> {
    const now = input.archivedAt ?? new Date().toISOString()

    let localList = await this.sqliteRepo.findById(input.listId)
    if (!localList) localList = await this.sqliteRepo.findByRemoteId(input.listId)

    if (!localList) {
      return this.supabaseRepo.archive(input)
    }

    const updated = await this.sqliteRepo.update(localList.id, {
      status: 'archived',
      archivedAt: now,
      syncStatus: localList.remoteId ? 'pending_update' : 'pending_create',
    })

    if (localList.remoteId) {
      void this.syncArchive(updated)
    }

    return updated
  }

  async hydrateFromRemote(listId: string): Promise<void> {
    try {
      if (!await isConnected()) return

      // listId may be local UUID or Supabase UUID — resolve to remote before fetching
      let remoteListId = listId
      const localList = await this.sqliteRepo.findById(listId)
      if (localList?.remoteId) {
        remoteListId = localList.remoteId
      }

      const details = await this.supabaseRepo.getDetails(remoteListId)
      if (!details) return

      const upsertedList = await this.sqliteRepo.upsertFromRemote({
        remoteId: details.list.id,
        userId: details.list.userId,
        name: details.list.name,
        budget: details.list.budget,
        status: details.list.status,
        archivedAt: details.list.archivedAt,
        completedAt: details.list.completedAt,
        createdAt: details.list.createdAt,
        updatedAt: details.list.updatedAt,
      })

      for (const item of details.items) {
        await this.sqliteItemRepo.upsertFromRemote(
          {
            remoteId: item.id,
            remoteListId: details.list.id,
            userId: item.userId,
            productId: item.productId || null,
            productName: item.productName ?? 'Produto',
            brand: item.productBrand ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            bought: item.bought,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          upsertedList.id,
        )
      }
    } catch {
      logger.warn('hydrateFromRemote: falha ao hidratar lista', { listId })
    }
  }

  private async syncCreate(
    localRecord: LocalListRecord,
    input: CreateShoppingListInput,
  ): Promise<void> {
    try {
      if (!await isConnected()) return
      const created = await this.supabaseRepo.create(input)
      await this.sqliteRepo.updateSyncStatus(localRecord.id, 'synced', created.id)
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.all() })
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.active() })
      void this.queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.detail(localRecord.id),
      })
    } catch {
      await this.sqliteRepo.updateSyncStatus(localRecord.id, 'error')
      logger.warn('syncCreate: falha ao sincronizar lista', { listId: localRecord.id })
    }
  }

  private async syncComplete(localRecord: LocalListRecord): Promise<void> {
    try {
      if (!await isConnected()) return
      await this.supabaseRepo.complete({ listId: localRecord.remoteId! })
      await this.sqliteRepo.updateSyncStatus(localRecord.id, 'synced')
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.all() })
      void this.queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.detail(localRecord.id),
      })
    } catch {
      logger.warn('syncComplete: falha ao sincronizar conclusão', { listId: localRecord.id })
    }
  }

  private async syncArchive(localRecord: LocalListRecord): Promise<void> {
    try {
      if (!await isConnected()) return
      await this.supabaseRepo.archive({ listId: localRecord.remoteId! })
      await this.sqliteRepo.updateSyncStatus(localRecord.id, 'synced')
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.all() })
      void this.queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.detail(localRecord.id),
      })
    } catch {
      logger.warn('syncArchive: falha ao sincronizar arquivamento', { listId: localRecord.id })
    }
  }
}
