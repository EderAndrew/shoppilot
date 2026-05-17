# Implementation Plan: Fase 1 de Melhorias de UX

**Branch**: `005-fase1-melhorias-ux`  
**Spec**: `specs/005-fase1-melhorias-ux/spec.md`  
**Research**: `specs/005-fase1-melhorias-ux/research.md`  
**Data model**: `specs/005-fase1-melhorias-ux/data-model.md`

---

## Prerequisite: No Migration Required

`products.brand` already exists. All DB types are already reflected in `database.types.ts`. No `supabase/migrations/` additions needed.

---

## Task 1 — Persistent Session (FR-1)

**Goal**: App restores session on startup without re-prompting for credentials.

### 1.1 — `src/shared/providers/AppProviders.tsx`

- Pass `initialState="loading"` to `<AuthSessionProvider>`. This causes `isLoading=true` in the auth guard until the restore query completes.
- Render a new `<SessionRestorer />` component as a child of `QueryClientProvider` (so it has access to TanStack Query) and as a descendant of `AuthSessionProvider` (so it can call `setSession`). Place it next to `<Slot />` / `children`.

```tsx
// Before (current)
<AuthSessionProvider>{children}</AuthSessionProvider>

// After
<AuthSessionProvider initialState="loading">
  <SessionRestorer />
  {children}
</AuthSessionProvider>
```

### 1.2 — Create `src/features/auth/SessionRestorer.tsx`

New component that calls `useRestoreSessionQuery()` once on mount and renders nothing:

```tsx
import { useRestoreSessionQuery } from "./auth.queries";

export function SessionRestorer() {
  useRestoreSessionQuery();
  return null;
}
```

**Behavior after this change**:
- App starts → `AuthState = "loading"` → `(app)/_layout.tsx` returns `null` (existing guard already handles this)
- `SessionRestorer` mounts → calls `RestoreSession` use case → `supabase.auth.getSession()` reads from SecureStore
- Session found → `setSession()` called → `AuthState = "authenticated"` → redirect succeeds, user lands on lists
- Session absent/expired → `setSession({ user: null })` → `AuthState = "unauthenticated"` → redirect to login

### 1.3 — Verify logout clears SecureStore

The existing `SupabaseAuthRepository.logout()` calls `supabase.auth.signOut()` which removes the persisted session from SecureStore automatically. No change needed.

**Files changed**: `AppProviders.tsx`, new `SessionRestorer.tsx`  
**Files unchanged**: `useAuthSession.ts`, `auth.queries.ts`, `SupabaseAuthRepository.ts`, `client.ts`

---

## Task 2 — Brand Field: Data Layer (FR-3, part 1)

**Goal**: Wire `products.brand` through the JOIN query → mapper → record type.

### 2.1 — `src/application/ports/ShoppingListItemRepository.ts`

Add `productBrand?: string | null` to `ShoppingListItemRecord`:

```ts
export type ShoppingListItemRecord = {
  // ... existing fields
  productName?: string | null;
  productBrand?: string | null;  // ADD
  // ...
};
```

### 2.2 — `src/infrastructure/mappers/shoppingListItemMapper.ts`

Extend `shoppingListItemRowToRecord` to accept and pass `productBrand`:

```ts
export function shoppingListItemRowToRecord(
  row: Tables<"shopping_list_items">,
  productName?: string | null,
  productBrand?: string | null,   // ADD
): ShoppingListItemRecord {
  return {
    // ...existing fields
    productBrand: productBrand ?? null,  // ADD
  };
}
```

### 2.3 — `src/infrastructure/repositories/SupabaseShoppingListRepository.ts` (`getDetails`)

Change the products sub-query from `select("id, name")` to `select("id, name, brand")` and build a parallel `productBrandsById` map. Pass brand to the mapper:

```ts
const productNamesById = new Map<string, string>();
const productBrandsById = new Map<string, string | null>();  // ADD

for (const product of products ?? []) {
  productNamesById.set(product.id, product.name);
  productBrandsById.set(product.id, product.brand ?? null);  // ADD
}

// In the items.map:
shoppingListItemRowToRecord(
  item,
  productNamesById.get(item.product_id),
  productBrandsById.get(item.product_id),  // ADD
)
```

**Files changed**: `ShoppingListItemRepository.ts` (port), `shoppingListItemMapper.ts`, `SupabaseShoppingListRepository.ts`

---

## Task 3 — Brand Field: Product Repository (FR-3, part 2)

**Goal**: Allow updating a product's brand (used by the item edit screen).

### 3.1 — `src/application/ports/ProductRepository.ts`

Add `updateBrand` method and input type:

```ts
export type UpdateProductBrandInput = {
  id: string;
  brand: string | null;
};

export type ProductRepository = {
  // ...existing
  updateBrand(input: UpdateProductBrandInput): Promise<ProductRecord>;
};
```

### 3.2 — `src/infrastructure/repositories/SupabaseProductRepository.ts`

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

### 3.3 — `src/features/products/product.queries.ts`

Add `useUpdateProductBrandMutation`:

```ts
export function useUpdateProductBrandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProductBrandInput) =>
      new UpdateProductBrand(defaultRepositories.products).execute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
  });
}
```

This requires adding a thin `UpdateProductBrand` use case to `src/application/use-cases/products.ts` (or inline directly in the hook — a one-liner is acceptable since there's no business logic beyond the repository call).

**Files changed**: `ProductRepository.ts` (port), `SupabaseProductRepository.ts`, `product.queries.ts`

---

## Task 4 — Brand Field: UI (FR-3, part 3)

**Goal**: Brand appears in the item row and in the item creation form.

### 4.1 — `src/features/shopping-list-items/ShoppingListItemForm.tsx`

Extend `ShoppingListItemFormValuesWithProductName` with `productBrand?: string`. Add a brand `AppInput` field shown when `productNameRequired=true` (inline creation mode):

```tsx
{productNameRequired ? (
  <>
    <Controller name="productName" ... />
    <Controller
      control={form.control}
      name="productBrand"
      render={({ field, fieldState }) => (
        <AppInput
          accessibilityLabel="Marca do produto (opcional)"
          error={fieldState.error?.message}
          id="productBrand"
          label="Marca (opcional)"
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          value={field.value ?? ""}
        />
      )}
    />
  </>
) : null}
```

Also add a brand field in the form when `enableProductPicker=false` (edit mode), so the user can edit the product's brand from the item edit screen. Control this with a new `showBrandField?: boolean` prop (the edit screen will pass `showBrandField` when the item has a `productId`).

### 4.2 — `src/app/(app)/(tabs)/lists/[listId]/item-new.tsx`

Pass `brand: values.productBrand || null` when calling `createProduct.mutate()`:

```ts
createProduct.mutate(
  { name: values.productName ?? "Produto", brand: values.productBrand || null },
  { onSuccess: (product) => addSelectedProductItem({ ... }) },
);
```

### 4.3 — `src/features/shopping-list-items/ShoppingListItemRow.tsx`

Display brand as a second subtitle line. Add `isReadOnly?: boolean` prop:

```tsx
export type ShoppingListItemRowProps = {
  item: ShoppingListItemRecord;
  isReadOnly?: boolean;    // ADD
  onEdit: () => void;
  onToggleBought: (bought: boolean) => void;
  onRemove: () => void;
};

// In the render:
<AppListItem
  subtitle={[
    item.productBrand,                             // ADD: show brand if present
    `${item.quantity} × ${formatMoney(item.unitPrice)}`,
  ].filter(Boolean).join(" · ")}
  onPress={isReadOnly ? undefined : onEdit}       // ADD: no-op when read-only
  ...
/>
{!isReadOnly ? (                                  // ADD: hide when read-only
  <AppButton icon={<Trash2 />} onPress={onRemove} ... />
) : null}
```

### 4.4 — `src/app/(app)/(tabs)/lists/[listId]/item-[itemId].tsx`

Pass brand defaultValues and handle brand update on submit:

```tsx
const updateBrand = useUpdateProductBrandMutation();

// defaultValues:
{
  bought: item.bought,
  productId: item.productId,
  productBrand: item.productBrand ?? "",  // ADD
  quantity: item.quantity,
  shoppingListId: listId,
  unitPrice: item.unitPrice,
}

// In onSubmit:
onSubmit={(values) => {
  const originalBrand = item.productBrand ?? null;
  const newBrand = values.productBrand?.trim() || null;
  const brandChanged = newBrand !== originalBrand;

  updateItem.mutate(
    { bought: values.bought, itemId, quantity: values.quantity, shoppingListId: listId, unitPrice: values.unitPrice },
    {
      onSuccess: () => {
        if (brandChanged) {
          updateBrand.mutate(
            { id: item.productId, brand: newBrand },
            { onSuccess: () => router.replace(`/(app)/(tabs)/lists/${listId}` as Href) },
          );
        } else {
          router.replace(`/(app)/(tabs)/lists/${listId}` as Href);
        }
      },
    },
  );
}}
```

Pass `showBrandField` to the form.

**Files changed**: `ShoppingListItemForm.tsx`, `item-new.tsx`, `ShoppingListItemRow.tsx`, `item-[itemId].tsx`

---

## Task 5 — Archived List Read-Only (FR-4)

**Goal**: Prevent mutations on archived lists in both the UI and service layer.

### 5.1 — Service layer: `src/application/use-cases/shoppingListItems.ts`

Add archived guard at the top of each execute method:

**`AddShoppingListItem.execute`** — after fetching `previousPrice` (before the first write), check that the list exists and is not archived. The list details are already fetched at the end of the method; add a guard using a pre-fetch or inline check:

```ts
// At the start of execute, before any writes:
const listDetails = await this.shoppingLists.getDetails(input.shoppingListId);
if (!listDetails) throw createAppError({ category: "not_found", message: "Lista não encontrada." });
if (listDetails.list.status === "archived") {
  throw createAppError({ category: "forbidden", message: "Esta lista está arquivada e não pode ser modificada." });
}
```

Apply the same guard to `UpdateShoppingListItem.execute` (it already fetches `currentDetails` — add the check after that fetch) and `RemoveShoppingListItem.execute` (add a guard before the delete, using `getDetails` which is already fetched when `userEvents` is present).

### 5.2 — UI: `src/app/(app)/(tabs)/lists/[listId]/index.tsx`

Gate "Add Item" button on `status === "active"` (mirrors the existing "Complete" button gate):

```tsx
{details.data.list.status === "active" ? (
  <YStack flex={1}>
    <AppButton onPress={() => router.push(...)} icon={<Plus size={16} />}>Item</AppButton>
  </YStack>
) : null}
```

Add a read-only banner when `status === "archived"`:

```tsx
{details.data.list.status === "archived" ? (
  <StatusState
    message="Esta lista está arquivada e é somente leitura."
    tone="info"
  />
) : null}
```

Pass `isReadOnly={details.data.list.status === "archived"}` to every `ShoppingListItemRow`.

**Files changed**: `shoppingListItems.ts` (use cases), `lists/[listId]/index.tsx`

---

## Task 6 — App Version Display (FR-5)

### 6.1 — Create `src/shared/utils/appVersion.ts`

```ts
import Constants from "expo-constants";

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? "—";
}
```

### 6.2 — `src/app/(auth)/login.tsx`

Add version text at the bottom of the screen:

```tsx
import { getAppVersion } from "@/shared/utils/appVersion";

// Inside LoginScreen, after the existing YStack content:
<Text
  {...typography.caption}
  color={colors.textSecondary}
  style={{ textAlign: "center", marginTop: "auto" }}
>
  Versão {getAppVersion()}
</Text>
```

### 6.3 — `src/app/(app)/(tabs)/user/index.tsx`

Add version text at the bottom of the user screen (after the logout button):

```tsx
import { getAppVersion } from "@/shared/utils/appVersion";

<Text {...typography.caption} color={colors.textSecondary}>
  Versão {getAppVersion()}
</Text>
```

**Files changed**: new `appVersion.ts`, `login.tsx`, `user/index.tsx`

---

## Execution Order

Run tasks in this sequence — each builds on the previous:

1. **Task 1** (Session): No dependencies. Safe to start immediately.
2. **Task 2** (Brand data layer): No dependencies. Run in parallel with Task 1.
3. **Task 3** (Brand product repository): Requires Task 2 to define `productBrand` in the record type.
4. **Task 4** (Brand UI): Requires Tasks 2 and 3 to be complete.
5. **Task 5** (Archived read-only): Can run after Task 2 (needs updated `ShoppingListItemRow` props).
6. **Task 6** (Version): No dependencies. Can run at any point.

---

## Validation Checklist

After implementation, verify each criterion from the spec:

- [ ] Close and reopen the app with a valid session → lands on lists without login prompt
- [ ] Log out → lands on login screen; reopen → stays on login screen
- [ ] Add a new item with a brand → brand saved and visible in item row
- [ ] Add a new item without a brand → item saved, no brand shown
- [ ] Edit an item → form pre-fills product brand, qty, price; save reflects changes
- [ ] Navigate to an archived list detail via `lists/[listId]` → read-only banner shown, no add/edit/remove available
- [ ] Attempt to call `UpdateShoppingListItem` use case on an archived list → `AppError` with category `"forbidden"` thrown
- [ ] Login screen shows version from `app.json`
- [ ] User/profile screen shows the same version
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm --filter mobile test` passes

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `useRestoreSessionQuery` firing twice (StrictMode) | `useQuery` deduplicates concurrent calls by queryKey — safe |
| Brand edit on an item used by multiple lists changes all uses | By design: brand is a property of the product, not the list item. Documented in assumptions. |
| `StatusState` component doesn't have a `"info"` tone | Check `StatusState` props; use `"error"` with a neutral message or add `"info"` tone if the variant system supports it |
| Item edit screen calls two mutations sequentially — race or partial failure | Second mutation (brand) only fires on success of first; if brand update fails, item is saved but brand isn't updated. User can retry. Acceptable for this phase. |
