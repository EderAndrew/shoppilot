# Data Model: Monthly Shopping MVP

## Overview

The Phase 1 model is user-owned and audit-friendly. Mutable shopping state lives
in shopping lists, products, and list items. Historical and analytical data lives
in append-only price history and user event records.

All persisted entities include `id`, `user_id`, `created_at`, and ownership
checks. Mutable entities also include `updated_at`.

## Entity: User

**Source**: Supabase authenticated user.

**Fields used by app**:

- `id`: UUID from authenticated session.
- `email`: used for login/register UI.

**Rules**:

- All app data is scoped to the authenticated user's id.
- No shopping operation runs without a valid authenticated user.

## Entity: ShoppingList

**Table**: `shopping_lists`

**Fields**:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `name text not null`
- `budget numeric(12,2) not null`
- `status shopping_list_status not null default 'active'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `completed_at timestamptz null`
- `archived_at timestamptz null`

**Status values**:

- `active`
- `completed`
- `archived`

**Validation rules**:

- `name` must be non-empty after trimming.
- `budget` must be greater than zero.
- `status` must be one of the supported values.
- `completed_at` is set when status becomes `completed`.
- `archived_at` is set when status becomes `archived`.

**Relationships**:

- Has many `ShoppingListItem`.
- Has many `PriceHistory` records through list context.
- Has many `UserEvent` records by entity reference.

**State transitions**:

- `active -> completed`
- `active -> archived`
- `completed -> archived`
- `archived` is terminal for normal MVP flows.

**Domain behavior**:

- `calculateTotal(items)`: sum item totals for all current list items.
- `calculateRemainingBudget(items)`: budget minus current total.
- `calculateUsedPercentage(items)`: current total divided by budget times 100.
- `isOverBudget(items)`: current total is greater than budget.

**Indexes**:

- `(user_id, status, created_at desc)`
- `(user_id, created_at desc)`

## Entity: Product

**Table**: `products`

**Fields**:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `name text not null`
- `brand text null`
- `barcode text null`
- `unit text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

**Validation rules**:

- `name` must be non-empty after trimming.
- `brand`, `barcode`, and `unit` are optional but must be trimmed if provided.
- Duplicate prevention should compare user, normalized name, and optional
  identifying details when practical.

**Relationships**:

- Has many `ShoppingListItem`.
- Has many `PriceHistory`.
- Has many `UserEvent` records by entity reference.

**Indexes**:

- `(user_id, lower(name))`
- `(user_id, barcode)` where barcode is not null

## Entity: ShoppingListItem

**Table**: `shopping_list_items`

**Fields**:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `shopping_list_id uuid not null references shopping_lists(id) on delete cascade`
- `product_id uuid not null references products(id)`
- `quantity numeric(12,3) not null`
- `unit_price numeric(12,2) not null`
- `total_price numeric(12,2) not null`
- `bought boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

**Validation rules**:

- `quantity` must be greater than zero.
- `unit_price` must be greater than or equal to zero only if free items are
  intentionally allowed; Phase 1 form validation should require greater than
  zero for normal grocery price entry.
- `total_price` equals `quantity * unit_price` rounded consistently for display.
- `shopping_list_id` and `product_id` must belong to the same user.

**Relationships**:

- Belongs to one `ShoppingList`.
- Belongs to one `Product`.
- May produce many `PriceHistory` entries over time through item price changes.

**Domain behavior**:

- `calculateTotalPrice()`: quantity times unit price.
- `markBought()`: sets bought to true.
- `unmarkBought()`: allowed if tasks decide edit flow needs it; must not affect
  price history.
- `changePrice(newPrice)`: returns whether price history must be recorded.

**Indexes**:

- `(user_id, shopping_list_id)`
- `(user_id, product_id)`
- `(shopping_list_id, created_at)`

## Entity: PriceHistory

**Table**: `price_history`

**Fields**:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `product_id uuid not null references products(id)`
- `shopping_list_id uuid not null references shopping_lists(id)`
- `shopping_list_item_id uuid null references shopping_list_items(id) on delete set null`
- `price numeric(12,2) not null`
- `recorded_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

**Validation rules**:

- `price` must be greater than zero.
- Product, list, and item context must belong to the same user.
- Normal application flows never update or delete existing rows.

**Relationships**:

- Belongs to one `Product`.
- Belongs to one `ShoppingList`.
- Optionally references the list item that produced the price record.

**Domain behavior**:

- `recordPrice(product, list, item, price)`: creates a new record.
- `getLatestPreviousPrice(productId, beforeRecord?)`: returns latest prior price
  for comparison.
- `comparePrice(current, previous)`: returns `more_expensive`, `cheaper`,
  `unchanged`, or `no_history` with absolute and percentage difference.

**Indexes**:

- `(user_id, product_id, recorded_at desc)`
- `(user_id, shopping_list_id, recorded_at desc)`

## Entity: UserEvent

**Table**: `user_events`

**Fields**:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `event_type user_event_type not null`
- `entity_type text not null`
- `entity_id uuid not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

**Event types**:

- `SHOPPING_LIST_CREATED`
- `SHOPPING_LIST_COMPLETED`
- `PRODUCT_CREATED`
- `ITEM_ADDED`
- `ITEM_UPDATED`
- `ITEM_REMOVED`
- `ITEM_CHECKED`
- `PRICE_RECORDED`

**Validation rules**:

- `event_type` must be supported.
- `entity_type` must identify the aggregate affected by the action.
- `metadata` must avoid tokens, credentials, raw session data, and unnecessary
  personal data.
- Normal application flows never update or delete existing rows.

**Relationships**:

- References an entity by `entity_type` and `entity_id`.
- Always belongs to one user.

**Indexes**:

- `(user_id, event_type, created_at desc)`
- `(user_id, entity_type, entity_id, created_at desc)`

## Database Types

`shopping_list_status`:

- `active`
- `completed`
- `archived`

`user_event_type`:

- `SHOPPING_LIST_CREATED`
- `SHOPPING_LIST_COMPLETED`
- `PRODUCT_CREATED`
- `ITEM_ADDED`
- `ITEM_UPDATED`
- `ITEM_REMOVED`
- `ITEM_CHECKED`
- `PRICE_RECORDED`

## Cross-Entity Rules

- A list item cannot connect a list and product owned by different users.
- Price history cannot reference product/list/item data owned by another user.
- User events are written only after the business action succeeds.
- Item removal removes the current item row from normal list state but never
  removes historical price rows.
- Completing a list does not freeze price history globally; future lists can
  still reuse products and compare against prior records.
- Budget totals are derived from current list items, not stored as authoritative
  values.

## RLS Ownership Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `shopping_lists` | own rows | `user_id = auth.uid()` | own rows only | own rows if not needed for history, otherwise archive |
| `products` | own rows | `user_id = auth.uid()` | own rows only | own rows only if no active references |
| `shopping_list_items` | own rows | `user_id = auth.uid()` and owned list/product | own rows only | own rows only |
| `price_history` | own rows | `user_id = auth.uid()` and owned context | no normal app updates | no normal app deletes |
| `user_events` | own rows | `user_id = auth.uid()` | no normal app updates | no normal app deletes |
