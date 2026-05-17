# Research: Fase 1 de Melhorias de UX

## FR-1: Persistent Authentication Session

### Finding
The Supabase client (`src/infrastructure/supabase/client.ts`) is already configured with `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`, and uses `expo-secure-store` for storage — all correct settings. The `RestoreSession` use case and `useRestoreSessionQuery` hook already exist.

**Root cause**: `AppProviders` mounts `AuthSessionProvider` without an `initialState`, so the context starts as `"unauthenticated"` (derived from the empty default session). The auth guard in `(app)/_layout.tsx` sees `isAuthenticated=false` and redirects to login before `useRestoreSessionQuery()` ever runs. No component calls `useRestoreSessionQuery()` at app startup.

### Decision
- Start `AuthSessionProvider` in `"loading"` state by passing `initialState="loading"` from `AppProviders`
- Add a `SessionRestorer` component (renders `null`, calls `useRestoreSessionQuery()`) inside `AppProviders` — it must be a child of both `QueryClientProvider` and `AuthSessionContext`
- No changes needed to the auth guard or Supabase client config

### Alternatives Considered
- Calling `supabase.auth.getSession()` inside a `useEffect` in `app/_layout.tsx` — rejected: bypasses the use-case layer
- Adding session-restore to the existing `AuthSessionProvider` as an internal effect — rejected: the provider is pure state; mixing async I/O in there violates the current separation

---

## FR-3: Brand Field on Items

### Finding
The `products` table already has a `brand text nullable` column. The `Product` entity, `ProductRecord`, `CreateProductInput`, and `database.types.ts` all include `brand`. **No DB migration is needed.**

`SupabaseShoppingListRepository.getDetails` only selects `id, name` from products during the JOIN — it does not fetch `brand`. `shoppingListItemRowToRecord` accepts an optional `productName` but no `productBrand`. `ShoppingListItemRecord` has no `productBrand` field. `ShoppingListItemRow` does not display brand.

The item-new screen creates products inline via `createProduct.mutate({ name: values.productName })` without passing brand, even though `CreateProductInput.brand` already exists.

### Decision
- No migration required
- Wire `brand` through the existing JOIN query → mapper → record type → item row
- Add `productBrand` field to `ShoppingListItemFormValuesWithProductName` and show it in the form when `productNameRequired=true` (inline product creation mode)
- Add `ProductRepository.updateBrand` and `SupabaseProductRepository.updateBrand` to support brand editing from the item edit screen
- Display brand as secondary text on item rows

### Alternatives Considered
- Adding `brand` to `shopping_list_items` as a denormalized column — rejected: brand belongs on the product; future price-by-brand comparison relies on `products.brand`
- Using a separate product-edit screen for brand — rejected: adds unnecessary navigation steps

---

## FR-2: Item Editing

### Finding
The item edit screen (`item-[itemId].tsx`) already exists and already works for quantity and unit price. `ShoppingListItemRow` already accepts and calls `onEdit`. The `useUpdateShoppingListItemMutation` hook and `UpdateShoppingListItem` use case already exist.

**What's missing**: the edit form does not show product name as context, does not show/edit the product's brand, and does not call any product update when brand changes.

### Decision
- Extend the edit screen to pass `productBrand` as a default value once FR-3 makes `item.productBrand` available
- Keep add/edit sharing the same `ShoppingListItemForm` component — no duplication
- On save: call `updateItem` for qty/price, and additionally call a `useUpdateProductBrandMutation` if brand has changed
- Two separate mutations on the edit screen is simpler than merging product+item update into one use case

### Alternatives Considered
- Merging product brand update into `UpdateShoppingListItem` use case — rejected: inflates the item use case with product concerns; would require adding `ProductRepository` as a dependency to the item use case

---

## FR-4: Archived List Read-Only Enforcement

### Finding
`archived/[listId]/index.tsx` already renders items as read-only `AppListItem` components with no edit/remove buttons — no changes needed there.

`lists/[listId]/index.tsx` gates the "Complete" button on `status === "active"` but does **not** gate the "Add Item" button. `ShoppingListItemRow` always shows edit and remove actions.

The use cases (`AddShoppingListItem`, `UpdateShoppingListItem`, `RemoveShoppingListItem`) do not check list status before mutating.

`"forbidden"` is an existing `AppErrorCategory` with a localized default message (`"Você não tem permissão para fazer isso."`).

### Decision
- Add `isReadOnly` prop to `ShoppingListItemRow`; when true: remove `onPress` from `AppListItem` and hide the remove button
- Gate "Add Item" button in `lists/[listId]/index.tsx` on `status === "active"` (same pattern as the existing "Complete" button gate)
- Add a `"Lista arquivada — somente leitura"` status banner in `lists/[listId]/index.tsx` when `status === "archived"`
- Add service-layer guard at the start of `AddShoppingListItem.execute`, `UpdateShoppingListItem.execute`, and `RemoveShoppingListItem.execute`: check `currentDetails.list.status === "archived"` and throw `createAppError({ category: "forbidden", ... })`

### Alternatives Considered
- RLS-only enforcement — rejected: RLS enforces ownership, not status. The DB has no policy preventing writes to archived list items
- Only UI enforcement — rejected: the spec explicitly requires service-layer enforcement

---

## FR-5: Visible App Version

### Finding
`expo-constants` is already installed (`~18.0.13`). `app.json` declares `version: "1.0.0"`. `Constants.expoConfig?.version` is the correct access pattern for the managed Expo workflow.

No existing version display or centralized helper exists.

### Decision
- Create `apps/mobile/src/shared/utils/appVersion.ts` exporting `getAppVersion(): string`
- Use `Constants.expoConfig?.version ?? "—"` inside the helper
- Add `<Text>Versão {getAppVersion()}</Text>` to the bottom of the login screen and the user/profile screen

### Alternatives Considered
- `expo-application.nativeApplicationVersion` — rejected: returns the native build version, not the JS config version; differs on web
- Hardcoded string — explicitly rejected by spec

---

## Architecture Constraints

- No new packages required (all dependencies are already installed)
- No DB migrations required (`products.brand` already exists)
- All Supabase code stays in `src/infrastructure`
- Domain code stays framework-free
- Brand editing through the item form updates `products.brand`, not `shopping_list_items`
