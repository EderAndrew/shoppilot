# Data Model: Fase 1 de Melhorias de UX

## Database

No migrations required. All necessary columns already exist.

| Table | Column | Status |
|---|---|---|
| `products` | `brand text` | Already exists — nullable, no change |
| `shopping_list_items` | — | No changes |
| `shopping_lists` | `status` enum | Already includes `"archived"` — no change |

---

## Application Layer Changes

### `ShoppingListItemRecord` (port type)

**File**: `src/application/ports/ShoppingListItemRepository.ts`

Add `productBrand` field:

```ts
export type ShoppingListItemRecord = {
  id: string;
  userId: string;
  shoppingListId: string;
  productId: string;
  productName?: string | null;
  productBrand?: string | null;   // NEW
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  bought: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### `ProductRepository` (port type)

**File**: `src/application/ports/ProductRepository.ts`

Add `updateBrand` method and its input type:

```ts
export type UpdateProductBrandInput = {
  id: string;
  brand: string | null;
};

export type ProductRepository = {
  create(input: CreateProductInput): Promise<ProductRecord>;
  search(input: ProductSearchInput): Promise<ProductRecord[]>;
  getById(productId: string): Promise<ProductRecord | null>;
  findDuplicateCandidates(input: ProductDuplicateCandidateInput): Promise<ProductRecord[]>;
  updateBrand(input: UpdateProductBrandInput): Promise<ProductRecord>;   // NEW
};
```

---

## Infrastructure Layer Changes

### `shoppingListItemRowToRecord` mapper

**File**: `src/infrastructure/mappers/shoppingListItemMapper.ts`

Accept `productBrand` as a second optional parameter and include it in the returned record.

### `SupabaseShoppingListRepository.getDetails`

**File**: `src/infrastructure/repositories/SupabaseShoppingListRepository.ts`

Change product JOIN from:
```ts
.select("id, name")
```
to:
```ts
.select("id, name, brand")
```
Pass `brand` alongside `name` to the mapper call.

### `SupabaseProductRepository`

**File**: `src/infrastructure/repositories/SupabaseProductRepository.ts`

Implement `updateBrand`:
```ts
async updateBrand(input: UpdateProductBrandInput): Promise<ProductRecord> {
  await requireCurrentUserId(this.authRepository);
  const { data, error } = await this.client
    .from("products")
    .update({ brand: input.brand, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .select()
    .single();
  if (error) mapSupabaseError(error);
  return productRowToRecord(data);
}
```

---

## Feature Layer Changes

### `ShoppingListItemFormValuesWithProductName`

**File**: `src/features/shopping-list-items/ShoppingListItemForm.tsx`

Add `productBrand?: string`:
```ts
export type ShoppingListItemFormValuesWithProductName = ShoppingListItemFormValues & {
  productName?: string;
  productBrand?: string;   // NEW
};
```

### `ShoppingListItemForm` — props

Add `showBrandField?: boolean` prop (shown when in product-name-required mode or when editing with product context).

### `ShoppingListItemRow` — props

**File**: `src/features/shopping-list-items/ShoppingListItemRow.tsx`

Add `isReadOnly?: boolean` prop:
- When `isReadOnly=true`: remove `onPress` from `AppListItem` and do not render the remove button
- Display brand as a second line in the subtitle when `item.productBrand` is present

---

## Domain Layer: No Changes

The `ShoppingList.status` field is already typed as `"active" | "completed" | "archived"`. No domain entity changes are needed. The archived status check in use cases uses `status === "archived"` inline.

---

## New Utility

### `getAppVersion`

**File**: `src/shared/utils/appVersion.ts` (new)

```ts
import Constants from "expo-constants";

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? "—";
}
```

---

## Session Restoration

### `SessionRestorer`

**File**: `src/features/auth/SessionRestorer.tsx` (new)

A React component that renders `null` and calls `useRestoreSessionQuery()` on mount.

### `AppProviders`

**File**: `src/shared/providers/AppProviders.tsx`

- Pass `initialState="loading"` to `AuthSessionProvider`
- Render `<SessionRestorer />` inside `QueryClientProvider` and inside the auth context
