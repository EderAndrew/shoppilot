# Quickstart: Fase 1 de Melhorias de UX

## What this branch changes

Five targeted UX improvements — no new packages, no DB migrations.

## Key files to understand before starting

| File | Why it matters |
|---|---|
| `src/shared/providers/AppProviders.tsx` | Session restore wired here |
| `src/features/auth/auth.queries.ts` | `useRestoreSessionQuery` already exists — just needs a caller |
| `src/infrastructure/repositories/SupabaseShoppingListRepository.ts` → `getDetails` | Products JOIN — brand must be added here |
| `src/application/ports/ShoppingListItemRepository.ts` | Add `productBrand` to record type |
| `src/features/shopping-list-items/ShoppingListItemForm.tsx` | Shared form for add + edit — brand field goes here |
| `src/features/shopping-list-items/ShoppingListItemRow.tsx` | Brand display + `isReadOnly` prop |
| `src/application/use-cases/shoppingListItems.ts` | Archived guard goes in all three mutation use cases |
| `src/app/(app)/(tabs)/lists/[listId]/index.tsx` | Gate "Add Item" and show read-only banner |

## Quickstart order

```bash
# 1. Create branch
git checkout -b 005-fase1-melhorias-ux

# 2. Validate baseline
pnpm typecheck && pnpm test

# 3. Implement in order (see plan.md Tasks 1–6)
# Task 1: Session restore (AppProviders + SessionRestorer)
# Task 2: Brand in data layer (record type + mapper + getDetails)
# Task 3: ProductRepository.updateBrand
# Task 4: Brand in UI (form + row + edit screen)
# Task 5: Archived read-only (use cases + list detail screen)
# Task 6: App version (util + login screen + user screen)

# 4. Validate after each task
pnpm typecheck
pnpm --filter mobile test

# 5. Manual smoke test
pnpm mobile:start
# - Log in, close app, reopen → should stay logged in
# - Add item with brand → brand visible in list
# - Edit item brand → brand updated
# - Archive a list → edit/remove hidden, service rejects mutations
# - Login screen shows version number
# - User screen shows version number
```

## No migration needed

`products.brand` already exists. The only schema change is to the TypeScript types in `src/application/ports/`.
