# Tasks: Fase 1 de Melhorias de UX — ShopPilot

**Feature**: `specs/005-fase1-melhorias-ux/`  
**Plan**: `specs/005-fase1-melhorias-ux/plan.md`  
**Spec**: `specs/005-fase1-melhorias-ux/spec.md`

## Pre-flight Notes (from planning research — no audit tasks needed)

- Supabase client already has `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`, and uses `expo-secure-store` — **client config is correct, no change needed**
- `products.brand text nullable` already exists — **no DB migration needed**
- Item edit screen (`item-[itemId].tsx`) and `useUpdateShoppingListItemMutation` already exist — edit route is wired, brand display + product branch missing
- `archived/[listId]/index.tsx` is already read-only — **no changes needed to archived detail screen**
- `expo-constants ~18.0.13` already installed, `app.json` has `"version": "1.0.0"`
- `"forbidden"` is an existing `AppErrorCategory` in `src/shared/errors/appError.ts`

---

## Phase 1: Setup

Verify the baseline compiles and tests pass before any changes.

- [x] T001 Run `pnpm typecheck && pnpm --filter mobile test` and confirm zero errors on the current branch before writing any code

---

## Phase 2: Foundational — Brand Data Layer

These three tasks unblock US2 (item editing) and US3 (brand field). Complete Phase 2 before those stories.

- [x] T002 [P] Add `productBrand?: string | null` field to `ShoppingListItemRecord` in `apps/mobile/src/application/ports/ShoppingListItemRepository.ts`
- [x] T003 [P] Extend `shoppingListItemRowToRecord` in `apps/mobile/src/infrastructure/mappers/shoppingListItemMapper.ts` to accept a third optional parameter `productBrand?: string | null` and include it in the returned record object
- [x] T004 In `SupabaseShoppingListRepository.getDetails` in `apps/mobile/src/infrastructure/repositories/SupabaseShoppingListRepository.ts`, change the products sub-query from `.select("id, name")` to `.select("id, name, brand")`; build a `productBrandsById` Map in parallel with the existing `productNamesById` Map; pass the brand value as the third argument when calling `shoppingListItemRowToRecord`

> T002 and T003 are independent and can run in parallel. T004 depends on T003.

---

## Phase 3: US1 — Persistent Session

**Story goal**: App restores a valid session on startup without re-prompting for login.

**Independent test criteria**: Close the app after login, reopen it — user lands on lists without seeing the login screen. Log out, reopen — user lands on login screen.

- [x] T005 [US1] Create `apps/mobile/src/features/auth/SessionRestorer.tsx` — a component that calls `useRestoreSessionQuery()` (already exported from `./auth.queries`) and returns `null`; the file should export a named `SessionRestorer` function component with no props
- [x] T006 [US1] In `apps/mobile/src/shared/providers/AppProviders.tsx`, make two changes: (1) pass `initialState="loading"` to `<AuthSessionProvider>`; (2) render `<SessionRestorer />` as an immediate child of `AuthSessionProvider` (before `{children}`), importing it from `../../features/auth/SessionRestorer`

> T005 must be created before T006 to avoid import errors. The auth guard in `(app)/_layout.tsx` already handles `isLoading` state — no changes needed there or in `SupabaseAuthRepository`.

---

## Phase 4: US3 — Brand Field on Items

**Story goal**: Users can add and view a brand on any shopping list item.

**Independent test criteria**: Add a new item, type a brand name, save — the brand appears below the product name in the list row. Add an item without a brand — item saves without error.

**Depends on**: Phase 2 complete.

- [x] T007 [P] [US3] In `apps/mobile/src/features/shopping-list-items/ShoppingListItemForm.tsx`, add `productBrand?: string` to `ShoppingListItemFormValuesWithProductName`; add a brand `AppInput` field (label `"Marca (opcional)"`, id `"productBrand"`) rendered via `<Controller>` immediately after the `productName` controller, but only when `productNameRequired=true`; pass `productBrand: values.productBrand` through `onSubmit` (same pattern as `productName`)
- [x] T008 [US3] In `apps/mobile/src/app/(app)/(tabs)/lists/[listId]/item-new.tsx`, update the `createProduct.mutate()` call to include `brand: values.productBrand?.trim() || null` alongside the existing `name` field
- [x] T009 [P] [US3] In `apps/mobile/src/features/shopping-list-items/ShoppingListItemRow.tsx`, add `isReadOnly?: boolean` to `ShoppingListItemRowProps`; update the `subtitle` prop of `AppListItem` to prepend the brand when `item.productBrand` is present (e.g. `[item.productBrand, "${item.quantity} × ${formatMoney(item.unitPrice)}"].filter(Boolean).join(" · ")`); when `isReadOnly=true`, pass `onPress={undefined}` to `AppListItem` and do not render the remove `AppButton`

> T007 and T009 are independent (different files) and can run in parallel. T008 depends on T007 (needs `productBrand` in form values type).

---

## Phase 5: US2 — Item Editing (Brand)

**Story goal**: Users can edit a list item's product name, brand, quantity, and price from the list view.

**Independent test criteria**: Tap an item row in an active list — edit form opens pre-filled with product name, brand, quantity, and price. Change the brand, save — brand updates in the list row without a full-screen reload.

**Depends on**: Phase 4 complete (needs `item.productBrand` and `ShoppingListItemForm` brand support).

- [x] T010 [P] [US2] Add `UpdateProductBrandInput` type (`{ id: string; brand: string | null }`) and add `updateBrand(input: UpdateProductBrandInput): Promise<ProductRecord>` method signature to `ProductRepository` in `apps/mobile/src/application/ports/ProductRepository.ts`
- [x] T011 [P] [US2] Implement `updateBrand` in `apps/mobile/src/infrastructure/repositories/SupabaseProductRepository.ts`: call `supabase.from("products").update({ brand: input.brand, updated_at: new Date().toISOString() }).eq("id", input.id).select().single()`, handle errors via `mapSupabaseError`, return `productRowToRecord(data)`; require current user first via `requireCurrentUserId`
- [x] T012 [US2] Add `useUpdateProductBrandMutation` to `apps/mobile/src/features/products/product.queries.ts`: `useMutation` whose `mutationFn` calls `defaultRepositories.products.updateBrand(input)` and whose `onSuccess` invalidates `queryKeys.products.all()`; import `UpdateProductBrandInput` from the port
- [x] T013 [US2] In `apps/mobile/src/app/(app)/(tabs)/lists/[listId]/item-[itemId].tsx`, make three changes: (1) add `productBrand: item.productBrand ?? ""` to the `defaultValues` passed to `ShoppingListItemForm`; (2) pass `enableProductPicker={false}` and the new `showBrandField` prop (or equivalent — expose brand field in edit mode by adding a `showBrandField?: boolean` prop to `ShoppingListItemForm` that also shows the brand field when true, regardless of `productNameRequired`); (3) in `onSubmit`, call `updateItem.mutate(...)` and on its success, if the submitted brand differs from `item.productBrand ?? null`, also call `updateBrand.mutate({ id: item.productId, brand: values.productBrand?.trim() || null })` before navigating back; import `useUpdateProductBrandMutation`

> T010 and T011 are independent (different files) and can run in parallel. T012 depends on T011. T013 depends on T012.

---

## Phase 6: US4 — Archived List Read-Only

**Story goal**: Items in archived lists cannot be edited, removed, or added. The UI communicates clearly that the list is read-only, and the service layer rejects any mutation attempt.

**Independent test criteria**: View an archived list via the active lists tab — no add/edit/remove buttons are visible, and a read-only message is shown. Attempt to call the update or remove use case for an item in an archived list — the use case throws an AppError with category `"forbidden"`.

**Depends on**: Phase 2 (needs `ShoppingListItemRow` with `isReadOnly` prop from Phase 4, T009).

- [x] T014 [P] [US4] In `apps/mobile/src/application/use-cases/shoppingListItems.ts`, add an archived guard to `AddShoppingListItem.execute`, `UpdateShoppingListItem.execute`, and `RemoveShoppingListItem.execute`: in each, after the first `getDetails` call (which already exists), check `if (currentDetails.list.status === "archived") throw createAppError({ category: "forbidden", message: "Esta lista está arquivada e não pode ser modificada." })`; for `AddShoppingListItem` which doesn't fetch details upfront, add a `getDetails` call at the start before any writes
- [x] T015 [P] [US4] In `apps/mobile/src/app/(app)/(tabs)/lists/[listId]/index.tsx`, make three changes: (1) wrap the "Item" (Add Item) `AppButton` in a `{details.data.list.status === "active" ? ... : null}` guard (same pattern as the existing "Complete" button); (2) add a `<StatusState message="Esta lista está arquivada e é somente leitura." tone="error" />` shown when `details.data.list.status === "archived"`; (3) pass `isReadOnly={details.data.list.status === "archived"}` to every `<ShoppingListItemRow>`

> T014 and T015 are independent (different files) and can run in parallel.

---

## Phase 7: US5 — App Version Display

**Story goal**: The current app version is visible on the login screen and the user profile screen, sourced from a single central helper.

**Independent test criteria**: Login screen shows "Versão 1.0.0" (or current version) at the bottom. User profile screen shows the same string. Changing `version` in `app.json` changes the displayed value without editing any screen file.

- [x] T016 [P] [US5] Create `apps/mobile/src/shared/utils/appVersion.ts` that exports `getAppVersion(): string` returning `Constants.expoConfig?.version ?? "—"` (import `Constants` from `"expo-constants"`)
- [x] T017 [P] [US5] Add version text to the bottom of `apps/mobile/src/app/(auth)/login.tsx`: inside the `<ScreenContainer centered>`, after the `AppButton` for "Criar Conta", add `<Text {...typography.caption} color={colors.textSecondary} style={{ textAlign: "center", marginTop: "auto" }}>Versão {getAppVersion()}</Text>`; import `getAppVersion` from `@/shared/utils/appVersion`
- [x] T018 [P] [US5] Add version text to `apps/mobile/src/app/(app)/(tabs)/user/index.tsx`: inside the `<YStack gap="$4">`, after the logout `AppButton`, add `<Text {...typography.caption} color={colors.textSecondary}>Versão {getAppVersion()}</Text>`; import `getAppVersion` from `@/shared/utils/appVersion`

> T017 and T018 depend on T016. T017 and T018 can run in parallel with each other.

---

## Phase 8: Polish & Quality

- [ ] T019 Run `pnpm typecheck` and fix all TypeScript errors introduced by the changes above
- [ ] T020 Run `pnpm lint` and fix all linting errors
- [ ] T021 Run `pnpm --filter mobile test` and fix any failing tests (particularly `tests/unit/infrastructure/shoppingMappers.test.ts` and `tests/security/repository-ownership.test.ts` may be affected by the mapper and use-case changes)
- [ ] T022 Manual smoke test: (1) log in, close app, reopen → confirm no login prompt; (2) log out, reopen → confirm login screen; (3) add item with brand → brand visible in row; (4) add item without brand → saves OK; (5) edit item brand → brand updates; (6) navigate to an archived list from the active lists tab → read-only banner shown, no add/edit/remove buttons; (7) confirm login and user screens show version number

---

## Dependencies Summary

```
Phase 1 (T001)
    └── Phase 2: T002 [P], T003 [P] → T004
        ├── Phase 3: T005 → T006          (US1 — session)
        ├── Phase 4: T007 [P], T009 [P] → T008  (US3 — brand field)
        │   └── Phase 5: T010 [P], T011 [P] → T012 → T013  (US2 — item edit)
        └── Phase 6: T014 [P], T015 [P]   (US4 — archived read-only)
Phase 7: T016 → T017 [P], T018 [P]        (US5 — version; independent)
Phase 8: T019 → T020 → T021 → T022
```

## Parallel Execution Opportunities

**Highest value parallel batches**:

1. `T002 + T003` — both target different files with no inter-dependency
2. `T007 + T009` — `ShoppingListItemForm` and `ShoppingListItemRow` are independent
3. `T010 + T011` — `ProductRepository` port and `SupabaseProductRepository` are independent
4. `T014 + T015` — use-case guard and UI screen are independent
5. `T016` + subsequent `T017 + T018` — version helper then both screen files

## Implementation Strategy (MVP First)

**Minimal deliverable after Phase 3** (US1): Session restoration works → most impactful user-facing fix, zero risk of breaking other features.

**Second delivery after Phase 4** (US3): Brand visible and settable on new items → unblocks the edit-brand story.

**Full delivery after Phases 5–7**: Item brand editing + archived read-only + version display.

## Task Summary

| Phase | Story | Tasks | Parallelizable |
|---|---|---|---|
| 1 Setup | — | T001 | — |
| 2 Foundational | — | T002–T004 | T002, T003 |
| 3 US1 Session | Scenarios 1–4 | T005–T006 | — |
| 4 US3 Brand Field | Scenarios 7–8 | T007–T009 | T007, T009 |
| 5 US2 Item Editing | Scenarios 5–6 | T010–T013 | T010, T011 |
| 6 US4 Archived R/O | Scenarios 9–10 | T014–T015 | T014, T015 |
| 7 US5 App Version | Scenarios 11–12 | T016–T018 | T017, T018 |
| 8 Polish | — | T019–T022 | — |

**Total tasks**: 22  
**Parallelizable**: 11 of 22 tasks carry `[P]` and can run simultaneously with their phase partners
