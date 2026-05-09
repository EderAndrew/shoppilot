# Supabase Contract: Monthly Shopping MVP

This contract describes the required database and security behavior for Phase 1
migrations. It is intentionally implementation-ready but does not create SQL in
this planning step.

## Required Tables

### `shopping_lists`

Columns:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `name text not null`
- `budget numeric(12,2) not null`
- `status shopping_list_status not null default 'active'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `completed_at timestamptz null`
- `archived_at timestamptz null`

Constraints:

- `budget > 0`
- trimmed `name` is not empty
- status is controlled by enum

Indexes:

- `shopping_lists_user_status_created_idx` on `(user_id, status, created_at desc)`
- `shopping_lists_user_created_idx` on `(user_id, created_at desc)`

### `products`

Columns:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `name text not null`
- `brand text null`
- `barcode text null`
- `unit text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- trimmed `name` is not empty
- optional text fields are nullable

Indexes:

- `products_user_name_idx` on `(user_id, lower(name))`
- `products_user_barcode_idx` on `(user_id, barcode)` where `barcode is not null`

### `shopping_list_items`

Columns:

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

Constraints:

- `quantity > 0`
- `unit_price >= 0` at database level; app validation requires positive normal
  grocery prices
- `total_price >= 0`
- owned list/product consistency must be enforced by repository checks and, if
  practical, database triggers or composite constraints

Indexes:

- `items_user_list_idx` on `(user_id, shopping_list_id)`
- `items_user_product_idx` on `(user_id, product_id)`
- `items_list_created_idx` on `(shopping_list_id, created_at)`

### `price_history`

Columns:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `product_id uuid not null references products(id)`
- `shopping_list_id uuid not null references shopping_lists(id)`
- `shopping_list_item_id uuid null references shopping_list_items(id) on delete set null`
- `price numeric(12,2) not null`
- `recorded_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

Constraints:

- `price > 0`
- append-only in normal app flows

Indexes:

- `price_history_user_product_recorded_idx` on `(user_id, product_id, recorded_at desc)`
- `price_history_user_list_recorded_idx` on `(user_id, shopping_list_id, recorded_at desc)`

### `user_events`

Columns:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `event_type user_event_type not null`
- `entity_type text not null`
- `entity_id uuid not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Constraints:

- event type is controlled by enum
- metadata is bounded by application validation

Indexes:

- `user_events_user_type_created_idx` on `(user_id, event_type, created_at desc)`
- `user_events_user_entity_created_idx` on `(user_id, entity_type, entity_id, created_at desc)`

## Required Enums

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

## RLS Policy Contract

RLS must be enabled on all five tables.

General policy pattern:

- SELECT: user can select rows where `user_id = auth.uid()`
- INSERT: user can insert rows only when `user_id = auth.uid()`
- UPDATE: user can update rows only where existing and new ownership remain
  `auth.uid()`
- DELETE: user can delete only own mutable rows where the app allows deletion

Append-only tables:

- `price_history`: no normal app UPDATE/DELETE policies.
- `user_events`: no normal app UPDATE/DELETE policies.

Cross-owner safety:

- For `shopping_list_items`, repository operations must verify that both
  `shopping_list_id` and `product_id` belong to `auth.uid()`.
- For `price_history`, repository operations must verify that product, list, and
  optional item context belong to `auth.uid()`.

## Mobile Client Contract

- Mobile uses only the Supabase anon/public configuration.
- Mobile never contains a service role key.
- Session tokens are handled by the auth client and secure storage support.
- All Supabase access is isolated under `apps/mobile/src/infrastructure/supabase`
  and repository adapters.
- UI components and route files must not import the Supabase client.

## Realtime Contract

Allowed Phase 1 subscription:

- active list item changes scoped to the current user's currently opened
  `shopping_list_id`

Subscription requirements:

- subscribe only after authentication and list ownership are known
- unsubscribe when leaving the list detail route
- refresh or patch TanStack Query cache for active list items and budget summary
- do not subscribe globally to all user tables in Phase 1
