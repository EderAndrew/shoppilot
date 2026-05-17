import type { QueryClient } from '@tanstack/react-query'

import type { AuthRepository } from '@/application/ports/AuthRepository'
import type {
  AddShoppingListItemInput,
  SetShoppingListItemBoughtInput,
  ShoppingListItemRecord,
  ShoppingListItemRepository,
  UpdateShoppingListItemInput,
} from '@/application/ports/ShoppingListItemRepository'
import { queryKeys } from '@/application/query-keys/queryKeys'
import type { SupabaseShoppingListItemRepository } from '@/infrastructure/repositories/SupabaseShoppingListItemRepository'
import { getDatabaseInstance } from '@/lib/db/database'
import { logger } from '@/shared/logging/logger'
import { requireCurrentUserId } from '@/infrastructure/repositories/supabaseRepositoryUtils'

import { isConnected } from './networkService'
import { SQLiteShoppingListItemRepository } from './SQLiteShoppingListItemRepository'
import { SQLiteShoppingListRepository } from './SQLiteShoppingListRepository'
import type { LocalItemRecord } from './localDbMapper'

export class LocalFirstShoppingListItemRepository implements ShoppingListItemRepository {
  private _sqliteRepo: SQLiteShoppingListItemRepository | null = null
  private _sqliteListRepo: SQLiteShoppingListRepository | null = null

  constructor(
    private readonly supabaseRepo: SupabaseShoppingListItemRepository,
    private readonly authRepo: AuthRepository,
    private readonly queryClient: QueryClient,
  ) {}

  private get sqliteRepo(): SQLiteShoppingListItemRepository {
    if (!this._sqliteRepo) {
      this._sqliteRepo = new SQLiteShoppingListItemRepository(getDatabaseInstance())
    }
    return this._sqliteRepo
  }

  private get sqliteListRepo(): SQLiteShoppingListRepository {
    if (!this._sqliteListRepo) {
      this._sqliteListRepo = new SQLiteShoppingListRepository(getDatabaseInstance())
    }
    return this._sqliteListRepo
  }

  async add(input: AddShoppingListItemInput): Promise<ShoppingListItemRecord> {
    const userId = await requireCurrentUserId(this.authRepo)

    const localRecord = await this.sqliteRepo.create({
      listId: input.shoppingListId,
      userId,
      productId: input.productId || null,
      productName: input.productName?.trim() || input.productId || 'Produto',
      brand: input.productBrand?.trim() || null,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      totalPrice: input.totalPrice,
    })

    void this.syncCreate(localRecord, input)

    return localRecord
  }

  async update(input: UpdateShoppingListItemInput): Promise<ShoppingListItemRecord> {
    let localItem = await this.sqliteRepo.findById(input.itemId)
    if (!localItem) localItem = await this.sqliteRepo.findByRemoteId(input.itemId)

    if (!localItem) {
      return this.supabaseRepo.update(input)
    }

    const newSyncStatus = localItem.remoteId ? 'pending_update' : 'pending_create'
    const updatedItem = await this.sqliteRepo.update(localItem.id, {
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      totalPrice: input.totalPrice,
      bought: input.bought,
      syncStatus: newSyncStatus,
    })

    if (localItem.remoteId) {
      void this.syncUpdate(updatedItem, input)
    }

    return updatedItem
  }

  async remove(itemId: string): Promise<void> {
    let localItem = await this.sqliteRepo.findById(itemId)
    if (!localItem) localItem = await this.sqliteRepo.findByRemoteId(itemId)

    if (!localItem) {
      return this.supabaseRepo.remove(itemId)
    }

    if (!localItem.remoteId) {
      await this.sqliteRepo.hardDelete(localItem.id)
      return
    }

    await this.sqliteRepo.softDelete(localItem.id)
    void this.syncDelete(localItem.remoteId, localItem.id, localItem.shoppingListId)
  }

  async setBought(input: SetShoppingListItemBoughtInput): Promise<ShoppingListItemRecord> {
    return this.supabaseRepo.setBought(input)
  }

  async listByShoppingList(shoppingListId: string): Promise<ShoppingListItemRecord[]> {
    const localItems = await this.sqliteRepo.findByListId(shoppingListId)
    if (localItems.length > 0) return localItems
    return this.supabaseRepo.listByShoppingList(shoppingListId)
  }

  private async syncDelete(remoteId: string, localId: string, listId: string): Promise<void> {
    try {
      if (!await isConnected()) return
      await this.supabaseRepo.remove(remoteId)
      await this.sqliteRepo.hardDelete(localId)
      void this.queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.items(listId),
      })
      void this.queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.detail(listId),
      })
    } catch {
      logger.warn('syncDelete: falha ao sincronizar remoção de item', { itemId: localId })
    }
  }

  private async syncUpdate(localRecord: LocalItemRecord, input: UpdateShoppingListItemInput): Promise<void> {
    try {
      if (!await isConnected()) return

      await this.supabaseRepo.update({
        ...input,
        itemId: localRecord.remoteId!,
      })

      await this.sqliteRepo.updateSyncStatus(localRecord.id, 'synced')

      void this.queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.items(localRecord.shoppingListId),
      })
      void this.queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.detail(localRecord.shoppingListId),
      })
    } catch {
      logger.warn('syncUpdate: falha ao sincronizar atualização de item', { itemId: localRecord.id })
    }
  }

  private async syncCreate(localRecord: LocalItemRecord, input: AddShoppingListItemInput): Promise<void> {
    try {
      if (!await isConnected()) return

      // Phase 2: shoppingListId may be a remote UUID or a local UUID
      // If local, resolve its remote_id for the Supabase call
      let remoteListId = input.shoppingListId
      const localList = await this.sqliteListRepo.findById(input.shoppingListId)
      if (localList?.remoteId) {
        remoteListId = localList.remoteId
      }

      const remoteItem = await this.supabaseRepo.add({
        ...input,
        shoppingListId: remoteListId,
      })

      await this.sqliteRepo.updateSyncStatus(localRecord.id, 'synced', remoteItem.id)

      void this.queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.items(input.shoppingListId),
      })
      void this.queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.detail(input.shoppingListId),
      })
    } catch (err) {
      await this.sqliteRepo.updateSyncStatus(localRecord.id, 'error')
      logger.warn('syncCreate: falha ao sincronizar item', { listId: input.shoppingListId })
    }
  }
}
