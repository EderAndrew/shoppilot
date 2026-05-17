# Tasks: Archived Lists, Tab Bar & Reusable Product Search

**Input**: Design documents from `specs/003-archived-lists-tabbar/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅  
**Branch**: `003-archived-lists-tabbar`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- All paths relative to `apps/mobile/src/`

---

## Phase 1: Setup & Audit (COMPLETE — findings in research.md)

**Purpose**: Baseline understanding before any code changes. All items confirmed via codebase audit.

- [x] T001 Confirm route structure — `(app)` is a Stack, no tabs, logout in headerRight
- [x] T002 Confirm archive field — `status: "active" | "completed" | "archived"` + `archivedAt` timestamp
- [x] T003 Confirm list query returns all statuses unfiltered — root cause of archived leakage
- [x] T004 Confirm reusable product model — no flag, all products in catalog are reusable
- [x] T005 Confirm ProductPicker renders a list below input — UI-only fix needed
- [x] T006 Confirm logout lives in `(app)/_layout.tsx` headerRight via `useLogoutMutation()`
- [x] T007 Confirm reusable components: `ShoppingListCard`, `AppCard`, `AppListItem`

**Checkpoint**: ✅ All audit findings documented. Implementation can begin.

---

## Phase 2: Foundational — Tab Bar Navigation (US1) 🎯 MVP Foundation

**Purpose**: The navigation skeleton. MUST be complete before US2, US3, US4 screens can be built.

**⚠️ CRITICAL**: Phases 3–7 all depend on this phase. Complete before any feature screens.

**Goal**: App has 3-tab structure (Lists / Archived / User); all existing screens remain reachable inside the Lists stack.

**Independent Test**: Launch app → 3 tabs visible → Lists tab shows existing home screen → navigate to a list detail → back → tab bar still present.

### Implementation for Tab Bar Foundation

- [x] T008 [US1] Create `app/(app)/(tabs)/` directory structure with placeholder files for all three tabs — create empty `archived/index.tsx` and `user/index.tsx` with `<Text>Em breve</Text>` as placeholders
- [x] T009 [US1] Create `app/(app)/(tabs)/_layout.tsx` — Tabs navigator with 3 tabs (Lists, Arquivados, Usuário) using Lucide icons (List, Archive, User) from `@tamagui/lucide-icons-2`
- [x] T010 [US1] Create `app/(app)/(tabs)/lists/_layout.tsx` — Stack layout for Lists tab (mirrors current `(app)/_layout.tsx` Stack behavior but without the logout headerRight)
- [x] T011 [US1] Create `app/(app)/(tabs)/archived/_layout.tsx` — Stack layout for Archived tab
- [x] T012 [US1] Move `app/(app)/index.tsx` → `app/(app)/(tabs)/lists/index.tsx` (copy content, do not change logic yet — filtering happens in Phase 3)
- [x] T013 [US1] Move `app/(app)/lists/new.tsx` → `app/(app)/(tabs)/lists/new.tsx`
- [x] T014 [US1] Move `app/(app)/lists/[listId].tsx` → `app/(app)/(tabs)/lists/[listId]/index.tsx` (note: nested directory for listId)
- [x] T015 [P] [US1] Move `app/(app)/lists/[listId]/item-new.tsx` → `app/(app)/(tabs)/lists/[listId]/item-new.tsx`
- [x] T016 [P] [US1] Move `app/(app)/lists/[listId]/item-[itemId].tsx` → `app/(app)/(tabs)/lists/[listId]/item-[itemId].tsx`
- [x] T017 [P] [US1] Move `app/(app)/lists/[listId]/insights.tsx` → `app/(app)/(tabs)/lists/[listId]/insights.tsx`
- [x] T018 [US1] Modify `app/(app)/_layout.tsx` — change from full Stack layout to a minimal auth-guard + modal-host Stack (remove `headerRight` logout button; keep auth redirect logic; ensure `products/new.tsx` still works as modal over tabs)
- [x] T019 [US1] Delete old route files that were moved: `app/(app)/index.tsx`, `app/(app)/lists/` directory (after confirming all files moved successfully)
- [x] T020 [US1] Create `app/(app)/(tabs)/user/index.tsx` — minimal User screen with temporary logout button (using `useLogoutMutation()`) so users are not stranded without logout before Phase 5 completes
- [x] T021 [US1] Verify `router.push` paths in moved screens still resolve correctly — search codebase for any hardcoded `/lists/`, `/lists/new`, `/lists/[listId]` paths and update to new routes if needed

**Checkpoint**: ✅ Tab bar visible. All existing screens accessible via Lists tab stack. Placeholder Archived and User tabs present with basic logout.

---

## Phase 3: User Story 2 — Active List Filtering

**Goal**: Lists tab shows ONLY non-archived lists. Archiving a list removes it from the screen immediately.

**Independent Test**: Archive any list → it disappears from Lists tab without page reload. Archived list does NOT appear anywhere on Lists tab.

### Implementation for Active List Filtering

- [x] T022 [P] [US2] Add `listActive(): Promise<ShoppingListRecord[]>` and `listArchived(): Promise<ShoppingListRecord[]>` to the port interface in `application/ports/ShoppingListRepository.ts`
- [x] T023 [P] [US2] Add `active` and `archived` sub-keys to `queryKeys.shoppingLists` in `application/query-keys/queryKeys.ts`:
  ```ts
  active:   () => [...queryKeys.shoppingLists.all(), "active"] as const,
  archived: () => [...queryKeys.shoppingLists.all(), "archived"] as const,
  ```
- [x] T024 [US2] Add `ListActiveShoppingLists` use case in `application/use-cases/shoppingLists.ts` — calls `this.shoppingLists.listActive()` (same pattern as existing `ListShoppingLists`)
- [x] T025 [US2] Add `ListArchivedShoppingLists` use case in `application/use-cases/shoppingLists.ts` — calls `this.shoppingLists.listArchived()`
- [x] T026 [US2] Implement `listActive()` in `infrastructure/repositories/SupabaseShoppingListRepository.ts`:
  ```ts
  async listActive() {
    await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("shopping_lists")
      .select()
      .neq("status", "archived")
      .order("created_at", { ascending: false });
    if (error) mapSupabaseError(error);
    return (data ?? []).map(shoppingListRowToRecord);
  }
  ```
- [x] T027 [US2] Implement `listArchived()` in `infrastructure/repositories/SupabaseShoppingListRepository.ts`:
  ```ts
  async listArchived() {
    await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("shopping_lists")
      .select()
      .eq("status", "archived")
      .order("archived_at", { ascending: false });
    if (error) mapSupabaseError(error);
    return (data ?? []).map(shoppingListRowToRecord);
  }
  ```
- [x] T028 [US2] Wire new use cases in `infrastructure/repositories/defaultRepositories.ts` (or wherever use case instances are created — verify the existing `listUseCases` object and add `listActive` and `listArchived` entries)
- [x] T029 [US2] Add `useActiveShoppingListsQuery()` hook in `features/shopping-list/shoppingList.queries.ts` using `queryKeys.shoppingLists.active()` and the new `listActive` use case
- [x] T030 [US2] Add `useArchivedShoppingListsQuery()` hook in `features/shopping-list/shoppingList.queries.ts` using `queryKeys.shoppingLists.archived()` and the new `listArchived` use case
- [x] T031 [US2] Update `app/(app)/(tabs)/lists/index.tsx` — replace `useShoppingListsQuery()` with `useActiveShoppingListsQuery()`
- [x] T032 [US2] Verify `useArchiveShoppingListMutation()` in `features/shopping-list/shoppingList.queries.ts` invalidates `queryKeys.shoppingLists.all()` (which cascades to both `active` and `archived` sub-keys) — update invalidation if needed
- [x] T033 [P] [US2] Add unit test for `ListActiveShoppingLists` in `tests/unit/` — mock repository returns mix of active/completed/archived lists, assert only non-archived returned
- [x] T034 [P] [US2] Add unit test for `ListArchivedShoppingLists` — mock repository returns mix, assert only archived returned

**Checkpoint**: ✅ Archive a list → disappears from Lists tab. Active and completed lists remain visible.

---

## Phase 4: User Story 3 — Archived Lists Screen

**Goal**: Archived tab shows all archived lists with month/year date. Tapping a list opens the detail.

**Independent Test**: Archive 2 lists → navigate to Archived tab → both appear with formatted date → tap one → detail opens.

### Implementation for Archived Lists Screen

- [x] T035 [P] [US3] Add `formatArchivedDate(archivedAt: string | null): string` utility — use `Intl.DateTimeFormat` with `pt-BR` locale and `{ month: 'long', year: 'numeric' }`. Capitalize first letter. Fallback to empty string or `"Data indisponível"` if null. Place in `shared/utils/formatters.ts` if that file exists, otherwise inline in `ShoppingListCard.tsx`
- [x] T036 [US3] Extend `features/shopping-list/ShoppingListCard.tsx` — add optional prop `showArchivedDate?: boolean`. When true and `list.archivedAt` is non-null, render formatted date as secondary text below the list name using existing Tamagui typography tokens (e.g., `$color.subtleText` or equivalent in the design system)
- [x] T037 [US3] Build `app/(app)/(tabs)/archived/index.tsx` — replace placeholder:
  - Use `useArchivedShoppingListsQuery()`
  - Render `FlatList` of `ShoppingListCard` with `showArchivedDate={true}`
  - Add loading state (spinner or skeleton matching existing Lists tab pattern)
  - Add empty state: "Nenhuma lista arquivada" with appropriate icon/illustration
  - Add error state matching existing patterns
  - On press: `router.push({ pathname: '/(app)/(tabs)/archived/[listId]', params: { listId: list.id } })`
- [x] T038 [US3] Create `app/(app)/(tabs)/archived/[listId]/index.tsx` — archived list detail:
  - Reuse existing `ShoppingListDetail` component structure from `(tabs)/lists/[listId]/index.tsx`
  - Do NOT render "Add Item" button or edit/remove item actions (list is read-only when archived)
  - Show list name, status badge, items in read-only mode
  - Back button navigates to Archived tab index

**Checkpoint**: ✅ Archived tab shows archived lists with `Maio de 2026` format dates. Detail opens correctly.

---

## Phase 5: User Story 4 — User Tab & Logout Migration

**Goal**: Logout lives in the User tab. No logout button anywhere else in the app.

**Independent Test**: Navigate to User tab → logout button visible and functional → redirected to login → re-login → no logout button in Lists or Archived headers.

### Implementation for User Tab

- [x] T039 [US4] Audit `features/auth/auth.queries.ts` and `shared/` — confirm how to access the authenticated user's email (`useAuthSession()` or equivalent). Note the exact hook/accessor for use in T040.
- [x] T040 [US4] Build `app/(app)/(tabs)/user/index.tsx` — replace placeholder with full User screen:
  - Display user email using the accessor identified in T039
  - "Sair" logout button using existing `useLogoutMutation()` hook
  - Use existing Tamagui `Button`, `Text`, `YStack` components
  - Center layout with appropriate spacing matching design system
  - Loading state on logout button while mutation is pending (`isPending` from `useLogoutMutation()`)
- [x] T041 [US4] Remove `headerRight` logout button from `app/(app)/_layout.tsx` — the permanent logout is now in the User tab. Verify the User screen placeholder (T020) already has logout before removing from header.
- [x] T042 [US4] Verify `app/(app)/(tabs)/lists/_layout.tsx` has no logout in its header — confirm clean header for Lists tab stack

**Checkpoint**: ✅ User tab is functional with logout. No logout anywhere else. COMPLETE ✅

---

## Phase 6: User Story 5 — ProductPicker Fix

**Goal**: Product input in add-item form shows no list. Shows inline suggestion on match, or "Nenhum produto reutilizável encontrado" on no match.

**Independent Test**: Open add-item form → type an existing product name → no list appears → first match is suggested. Type a non-existent name → only the "not found" message appears. Clear field → nothing appears below input.

### Implementation for ProductPicker

- [x] T043 [US5] Read `features/products/ProductPicker.tsx` fully — identify: search query hook, `onSelect` callback, how products list is currently rendered, whether debounce is already in place
- [x] T044 [US5] Modify `features/products/ProductPicker.tsx` — rewrite render logic below the search input:
  - **State: query empty** → render nothing below input
  - **State: query non-empty, results exist** → do NOT render a list; instead call `onSelect(products.data[0])` automatically OR render a single inline suggestion chip using `AppListItem` (single item, not a list) with "Usar: [product name]" label that calls `onSelect` on press
  - **State: query non-empty, results empty, not loading** → render `<Text color="$colorSubtle" fontSize="$3">Nenhum produto reutilizável encontrado</Text>` (use existing Tamagui color token for subtle/muted text)
  - **State: loading** → render nothing or a small inline spinner (no list skeleton)
  - Remove `FlatList` / `.map()` product list entirely
- [x] T045 [US5] Verify debounce is in place for the product search query — if not, add 300ms debounce on the search input `onChangeText` to avoid excessive API calls. Check if `useDebounce` or similar exists in `shared/`; if not, implement with `useRef` + `setTimeout` pattern
- [x] T046 [US5] Verify `ShoppingListItemForm.tsx` and any other consumer of `ProductPicker` — confirm the `onSelect` callback still works correctly with the new single-suggestion behavior. Test that selected product name populates the form field correctly.

**Checkpoint**: ✅ Add-item form has clean product field. No list visible. Suggestion or not-found message only.

---

## Phase 7: Polish, UX Consistency & Final Validation

**Purpose**: Cross-cutting improvements and regression validation.

### UI/UX Polish

- [x] T047 [P] Review Tab Bar icon choices — confirm `List`, `Archive`, `User` Lucide icons render correctly on both iOS and Android. Adjust icon names if any do not exist in `@tamagui/lucide-icons-2`.
- [x] T048 [P] Verify loading states on Lists tab and Archived tab match — both should use the same skeleton/spinner pattern as existing screens
- [x] T049 [P] Verify empty state on Lists tab — if all lists are archived, "Nenhuma lista ativa" or equivalent message should appear (check existing empty state in moved `index.tsx`)
- [x] T050 [P] Verify error states on both Lists and Archived tabs show user-friendly error messages matching existing error handling patterns
- [x] T051 [P] Check `accessibilityLabel` on Tab Bar buttons — ensure "Listas", "Arquivados", "Usuário" labels are set for screen readers
- [x] T052 [P] Check `accessibilityLabel` on the new logout button in User tab — "Sair da conta" or "Sair"
- [x] T053 [P] Verify spacing and padding on User screen matches the design system (check `$space.4` / `$space.6` tokens used in existing screens)

### Regression & Integration Validation

- [x] T054 Navigate full user journey: login → create list → add items → mark items bought → archive list → confirm archive in Archived tab → logout
- [x] T055 Verify `products/new.tsx` modal still opens over tabs (e.g., from add-item form) and closes back to the correct tab
- [x] T056 Verify switching between tabs mid-flow preserves each tab's stack state (e.g., drilling into a list, switching to Archived tab, switching back — should still be on list detail in Lists tab)
- [x] T057 Run full test suite: `pnpm --filter mobile test` — confirm no regressions in unit, integration, and security tests
- [x] T058 Run typecheck: `pnpm typecheck` — confirm no TypeScript errors introduced
- [x] T059 Run lint: `pnpm lint` — confirm no ESLint violations introduced

**Checkpoint**: ✅ All acceptance criteria from spec.md verified. Feature ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Audit)**: Complete ✅
- **Phase 2 (Tab Bar)**: No dependencies — start immediately
- **Phase 3 (Active Filter)**: Depends on Phase 2 (lists tab must exist at new path)
- **Phase 4 (Archived Screen)**: Depends on Phase 2 (archived tab route) + Phase 3 (archived query hook)
- **Phase 5 (User Tab)**: Depends on Phase 2 (user tab placeholder exists with temporary logout)
- **Phase 6 (ProductPicker)**: No dependency on other phases — can be done in parallel with Phase 3
- **Phase 7 (Polish)**: Depends on all phases 2–6 complete

### User Story Dependencies

| Story | Depends on | Can parallelize with |
|-------|-----------|---------------------|
| US1 (Tab Bar) | — | — |
| US2 (Active Filter) | US1 | US4, US5 |
| US3 (Archived Screen) | US1, US2 | US4, US5 |
| US4 (User Tab) | US1 | US2, US3, US5 |
| US5 (ProductPicker) | — | US1, US2, US3, US4 |

### Parallel Opportunities

```bash
# After Phase 2 completes, these can run in parallel:
T022, T023  # Port interface + query keys (different files, no dependency)
T033, T034  # Unit tests (independent of implementation)

# T015, T016, T017  # Route file moves (different files)

# After Phase 3 completes:
T035        # formatArchivedDate utility (independent of T036)
T036        # ShoppingListCard extension (independent of T037)
T039        # Auth email audit (reading only)

# Phase 6 tasks can start any time after Phase 1:
T043 → T044 → T045 → T046  # Sequential: read → modify → verify debounce → verify form
```

---

## Parallel Example: Phase 2 Route Moves

```bash
# These can all run in parallel (different files):
Task: "T015 Move item-new.tsx to new path"
Task: "T016 Move item-[itemId].tsx to new path"
Task: "T017 Move insights.tsx to new path"
```

---

## Implementation Strategy

### MVP First (Tab Bar + Active Filter = Phases 2–3)

1. Complete Phase 2: Tab Bar skeleton
2. Complete Phase 3: Active list filtering
3. **STOP and VALIDATE**: Lists tab shows only active lists, tab bar works, no regressions
4. This alone fixes the most painful user problem (archived lists polluting main screen)

### Incremental Delivery

1. Phase 2 → Tab Bar in place, all existing features work
2. Phase 3 → Active filter live (highest-impact fix)
3. Phase 4 → Archived screen available
4. Phase 5 → Logout moved to User tab
5. Phase 6 → Clean product input
6. Phase 7 → Final polish and validation

### Solo Developer Sequence

Recommended order given one developer:

```
T008–T021 (Phase 2, sequential)
  → T022–T034 (Phase 3, partial parallel)
  → T035–T038 (Phase 4, partial parallel)
  → T039–T042 (Phase 5, sequential)
  → T043–T046 (Phase 6, sequential)
  → T047–T059 (Phase 7, partial parallel)
```

---

## Notes

- `[P]` tasks operate on different files and have no incomplete dependencies — safe to run in parallel
- `[Story]` label maps each task to a user story from spec.md for traceability
- Each phase ends with an independent checkpoint — stop and validate before proceeding
- `pnpm --filter mobile test` and `pnpm typecheck` should be run after each phase
- Commit after each phase or logical group using the branch `003-archived-lists-tabbar`
- Do NOT merge to main until Phase 7 validation complete
