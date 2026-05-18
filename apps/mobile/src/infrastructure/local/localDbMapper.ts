import type { ShoppingListStatus } from '@shop-pilot/shared/domain-types/shopping'

import type { ShoppingListItemRecord } from '@/application/ports/ShoppingListItemRepository'
import type { ShoppingListRecord } from '@/application/ports/ShoppingListRepository'

import type { SyncStatus } from './sync.types'

export type LocalListRecord = ShoppingListRecord & {
  localId: string
  remoteId: string | null
  deletedAt: string | null
}

export type LocalItemRecord = ShoppingListItemRecord & {
  localId: string
  remoteId: string | null
  remoteListId: string | null
  deletedAt: string | null
}

export type ListRow = {
  id: string
  remote_id: string | null
  user_id: string
  name: string
  budget: number
  status: string
  archived_at: string | null
  completed_at: string | null
  sync_status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ItemRow = {
  id: string
  remote_id: string | null
  list_id: string
  remote_list_id: string | null
  user_id: string
  product_id: string | null
  product_name: string
  brand: string | null
  quantity: number
  unit_price: number
  total_price: number
  bought: number
  sync_status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export function listRowToRecord(row: ListRow): LocalListRecord {
  return {
    id: row.id,
    localId: row.id,
    remoteId: row.remote_id,
    userId: row.user_id,
    name: row.name,
    budget: row.budget,
    status: row.status as ShoppingListStatus,
    archivedAt: row.archived_at,
    completedAt: row.completed_at,
    syncStatus: row.sync_status as SyncStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

export function itemRowToRecord(row: ItemRow): LocalItemRecord {
  return {
    id: row.id,
    localId: row.id,
    remoteId: row.remote_id,
    remoteListId: row.remote_list_id,
    userId: row.user_id,
    shoppingListId: row.list_id,
    productId: row.product_id ?? '',
    productName: row.product_name,
    productBrand: row.brand,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalPrice: row.total_price,
    bought: row.bought === 1,
    syncStatus: row.sync_status as SyncStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}
