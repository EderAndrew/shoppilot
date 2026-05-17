# Data Model: Banco Local SQLite e Modo Offline-First

**Feature**: 006-sqlite-offline-first  
**Phase**: 1 — Design  
**Date**: 2026-05-17

## Entidades Locais

### `local_shopping_lists`

Espelho local da tabela remota `shopping_lists`. Armazena estado local com controle de sincronização.

| Coluna | Tipo SQLite | Descrição |
|--------|-------------|-----------|
| `id` | `TEXT PRIMARY KEY` | UUID local gerado no dispositivo |
| `remote_id` | `TEXT` | ID do Supabase (`shopping_lists.id`), null até sync |
| `user_id` | `TEXT NOT NULL` | ID do usuário autenticado (Supabase Auth UID) |
| `name` | `TEXT NOT NULL` | Nome da lista |
| `budget` | `REAL NOT NULL DEFAULT 0` | Orçamento em reais |
| `status` | `TEXT NOT NULL DEFAULT 'active'` | `'active'` \| `'completed'` \| `'archived'` |
| `archived_at` | `TEXT` | ISO 8601, null se não arquivada |
| `completed_at` | `TEXT` | ISO 8601, null se não concluída |
| `sync_status` | `TEXT NOT NULL` | Valor de `SyncStatus` |
| `created_at` | `TEXT NOT NULL` | ISO 8601 |
| `updated_at` | `TEXT NOT NULL` | ISO 8601 |
| `deleted_at` | `TEXT` | Soft delete, null se ativo |

**Índices**: `remote_id`, `user_id`, `sync_status`

---

### `local_shopping_list_items`

Espelho local da tabela remota `shopping_list_items`. Desnormaliza nome e marca do produto para funcionar offline.

| Coluna | Tipo SQLite | Descrição |
|--------|-------------|-----------|
| `id` | `TEXT PRIMARY KEY` | UUID local gerado no dispositivo |
| `remote_id` | `TEXT` | ID do Supabase (`shopping_list_items.id`), null até sync |
| `list_id` | `TEXT NOT NULL` | FK → `local_shopping_lists.id` |
| `remote_list_id` | `TEXT` | ID remoto da lista pai, para sync |
| `user_id` | `TEXT NOT NULL` | ID do usuário autenticado |
| `product_id` | `TEXT` | ID do produto no Supabase (nullable para extensibilidade futura) |
| `product_name` | `TEXT NOT NULL` | Nome desnormalizado do produto |
| `brand` | `TEXT` | Marca desnormalizada do produto |
| `quantity` | `REAL NOT NULL DEFAULT 1` | Quantidade |
| `unit_price` | `REAL NOT NULL DEFAULT 0` | Preço unitário em reais |
| `total_price` | `REAL NOT NULL DEFAULT 0` | Calculado: `quantity * unit_price` |
| `bought` | `INTEGER NOT NULL DEFAULT 0` | Booleano (0/1) |
| `sync_status` | `TEXT NOT NULL` | Valor de `SyncStatus` |
| `created_at` | `TEXT NOT NULL` | ISO 8601 |
| `updated_at` | `TEXT NOT NULL` | ISO 8601 |
| `deleted_at` | `TEXT` | Soft delete, null se ativo |

**Índices**: `list_id`, `remote_id`, `sync_status`, `deleted_at`

---

### `_local_migrations`

Controle de versão do schema local. Nunca é excluída nem migrada.

| Coluna | Tipo SQLite | Descrição |
|--------|-------------|-----------|
| `version` | `INTEGER PRIMARY KEY` | Número sequencial da migration |
| `name` | `TEXT NOT NULL` | Nome descritivo (ex: `create_local_shopping_lists`) |
| `applied_at` | `TEXT NOT NULL` | ISO 8601 de quando foi executada |

---

## Enum `SyncStatus`

```ts
export const SyncStatus = {
  synced: 'synced',
  pending_create: 'pending_create',
  pending_update: 'pending_update',
  pending_delete: 'pending_delete',
  error: 'error',
} as const

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus]
```

**Transições válidas por operação**:

| Operação local | Estado anterior | Estado resultante |
|----------------|-----------------|-------------------|
| Criar item (offline ou online) | — | `pending_create` |
| Sync create bem-sucedido | `pending_create` | `synced` |
| Sync create falhou | `pending_create` | `error` |
| Editar item com remote_id | `synced` | `pending_update` |
| Editar item sem remote_id | `pending_create` | `pending_create` |
| Sync update bem-sucedido | `pending_update` | `synced` |
| Sync update falhou | `pending_update` | `error` |
| Remover item com remote_id | `synced` \| `pending_update` | `pending_delete` |
| Remover item sem remote_id | `pending_create` | (removido localmente) |
| Sync delete bem-sucedido | `pending_delete` | (soft deleted ou removido) |
| Sync delete falhou | `pending_delete` | `error` |

---

## Extensões de tipo no domínio

### `ShoppingListItemRecord` (extensão)

O tipo existente no port é estendido com campo opcional:

```ts
// application/ports/ShoppingListItemRepository.ts
export type ShoppingListItemRecord = {
  id: string
  userId: string
  shoppingListId: string
  productId: string
  productName?: string | null
  productBrand?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  bought: boolean
  createdAt: string
  updatedAt: string
  // NOVO — opcional para manter compatibilidade com SupabaseShoppingListItemRepository
  syncStatus?: SyncStatus
}
```

### `ShoppingListRecord` (extensão)

```ts
// application/ports/ShoppingListRepository.ts
export type ShoppingListRecord = {
  id: string
  userId: string
  name: string
  budget: number
  status: ShoppingListStatus
  createdAt: string
  updatedAt: string
  completedAt: string | null
  archivedAt: string | null
  // NOVO — opcional
  syncStatus?: SyncStatus
}
```

---

## Mapeamento Local ↔ Remoto

### Listas: `local_shopping_lists` ↔ `shopping_lists` (Supabase)

| Campo Local | Campo Remoto | Observação |
|-------------|--------------|------------|
| `id` | — | UUID local, não enviado ao Supabase |
| `remote_id` | `id` | Preenchido após sync bem-sucedido |
| `user_id` | `user_id` | Mesmo valor (Supabase Auth UID) |
| `name` | `name` | |
| `budget` | `budget` | |
| `status` | `status` | |
| `archived_at` | `archived_at` | |
| `completed_at` | `completed_at` | |
| `sync_status` | — | Apenas local |
| `deleted_at` | — | Apenas local (soft delete) |

### Itens: `local_shopping_list_items` ↔ `shopping_list_items` (Supabase)

| Campo Local | Campo Remoto | Observação |
|-------------|--------------|------------|
| `id` | — | UUID local |
| `remote_id` | `id` | Preenchido após sync |
| `list_id` | — | FK local |
| `remote_list_id` | `shopping_list_id` | Usado para sync remoto |
| `user_id` | `user_id` | |
| `product_id` | `product_id` | |
| `product_name` | `products.name` (join) | Desnormalizado |
| `brand` | `products.brand` (join) | Desnormalizado |
| `quantity` | `quantity` | |
| `unit_price` | `unit_price` | |
| `total_price` | `total_price` | |
| `bought` | `bought` | SQLite: INTEGER 0/1 |
| `sync_status` | — | Apenas local |
| `deleted_at` | — | Apenas local |

---

## Diagrama de Relacionamentos

```
_local_migrations
  version (PK)
  name
  applied_at

local_shopping_lists
  id (PK, UUID local)
  remote_id → shopping_lists.id (Supabase)
  user_id → auth.uid() (Supabase Auth)
  status: active | completed | archived
  sync_status: SyncStatus

local_shopping_list_items
  id (PK, UUID local)
  remote_id → shopping_list_items.id (Supabase)
  list_id (FK) → local_shopping_lists.id
  remote_list_id → shopping_lists.id (Supabase)
  product_id → products.id (Supabase, nullable)
  sync_status: SyncStatus
```

---

## Invariantes

1. Um item com `sync_status = 'pending_create'` NUNCA tem `remote_id` preenchido.
2. Um item com `sync_status = 'synced'` SEMPRE tem `remote_id` preenchido.
3. Um item com `deleted_at` preenchido NÃO aparece na UI (excluído logicamente).
4. Items em lista com `status = 'archived'` NÃO podem ser criados, editados ou removidos.
5. `total_price` = `quantity * unit_price` — calculado no momento da escrita local.
6. `user_id` em dados locais SEMPRE corresponde ao usuário autenticado atualmente — dados locais de outros usuários não são acessíveis.
