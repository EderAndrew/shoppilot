# Tasks: Monthly Shopping MVP

**Input**: Design documents from `specs/001-monthly-shopping-mvp/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Required for domain behavior, ownership/RLS boundaries, persistence
mappers, authentication flow, price history, event logging, and route smoke
coverage per constitution and plan.

**Organization**: Tasks are grouped by user story after shared setup and
foundational work. Each user story can be validated independently at its
checkpoint.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after dependencies are met because it touches different files.
- **[Story]**: Required only for user story phases: `[US1]`, `[US2]`, `[US3]`.
- Every task includes an exact file path and a concrete completion target.

## Phase 1: Setup (Shared Project Foundation)

**Purpose**: Prepare monorepo, mobile app providers, tooling, and folders without implementing feature behavior.

- [x] T001 Update root workspace scripts for mobile dev, typecheck, lint, and test commands in `package.json`
- [x] T002 Add missing mobile runtime dependencies for Supabase client and secure session storage in `apps/mobile/package.json`
- [x] T003 Add missing test/lint/format development dependencies needed by the plan in `apps/mobile/package.json`
- [x] T004 [P] Create shared package skeleton with exports in `packages/shared/package.json` and `packages/shared/src/index.ts`
- [x] T005 [P] Create config package skeleton with exports in `packages/config/package.json` and `packages/config/src/index.ts`
- [x] T006 [P] Configure TypeScript package references and path aliases for app/shared/config boundaries in `tsconfig.json` and `apps/mobile/tsconfig.json`
- [x] T007 [P] Configure mobile linting rules including no restricted Supabase imports from UI in `apps/mobile/eslint.config.js`
- [x] T008 [P] Configure formatting rules for the monorepo in `.prettierrc`
- [x] T009 [P] Configure mobile test runner for TypeScript domain/application tests in `apps/mobile/vitest.config.ts`
- [x] T010 Create planned source folders for Clean Architecture in `apps/mobile/src/domain`, `apps/mobile/src/application`, `apps/mobile/src/infrastructure`, `apps/mobile/src/features`, and `apps/mobile/src/shared`
- [x] T011 Create planned Expo Router route group folders in `apps/mobile/app/(auth)` and `apps/mobile/app/(app)`
- [x] T012 Create test folders for unit, integration, and security coverage in `apps/mobile/tests/unit`, `apps/mobile/tests/integration`, and `apps/mobile/tests/security`
- [x] T013 Add Tamagui configuration entrypoint in `apps/mobile/tamagui.config.ts`
- [x] T014 Add root app providers shell for Tamagui and TanStack Query in `apps/mobile/src/shared/providers/AppProviders.tsx`
- [x] T015 Wire `AppProviders` and Expo Router slot into `apps/mobile/app/_layout.tsx`
- [x] T016 Add environment variable schema and safe public config loader in `packages/config/src/env/mobile.ts`
- [x] T017 Add mobile environment type declarations for public Supabase values in `apps/mobile/src/shared/config/env.ts`
- [x] T018 Add example environment file documenting anon-key-only mobile config in `apps/mobile/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish database, security, domain primitives, repository ports, validation, auth boundaries, and shared app infrastructure that all user stories need.

**CRITICAL**: No user story implementation should begin until this phase is complete.

### Supabase Schema and RLS

- [x] T019 Create initial Supabase migration folder and migration file for enums in `supabase/migrations/001_monthly_shopping_mvp_schema.sql`
- [x] T020 Add `shopping_lists` table, constraints, timestamps, and indexes to `supabase/migrations/001_monthly_shopping_mvp_schema.sql`
- [x] T021 Add `products` table, constraints, timestamps, and indexes to `supabase/migrations/001_monthly_shopping_mvp_schema.sql`
- [x] T022 Add `shopping_list_items` table, constraints, timestamps, foreign keys, and indexes to `supabase/migrations/001_monthly_shopping_mvp_schema.sql`
- [x] T023 Add `price_history` append-only table, constraints, foreign keys, and indexes to `supabase/migrations/001_monthly_shopping_mvp_schema.sql`
- [x] T024 Add `user_events` append-only table, constraints, event enum, and indexes to `supabase/migrations/001_monthly_shopping_mvp_schema.sql`
- [x] T025 Enable RLS for all Phase 1 tables in `supabase/migrations/002_monthly_shopping_mvp_rls.sql`
- [x] T026 Add SELECT policies scoped by `auth.uid()` for all Phase 1 tables in `supabase/migrations/002_monthly_shopping_mvp_rls.sql`
- [x] T027 Add INSERT policies requiring `user_id = auth.uid()` for all Phase 1 tables in `supabase/migrations/002_monthly_shopping_mvp_rls.sql`
- [x] T028 Add UPDATE policies for mutable own rows in `shopping_lists`, `products`, and `shopping_list_items` in `supabase/migrations/002_monthly_shopping_mvp_rls.sql`
- [x] T029 Add DELETE policies for own mutable `products` and `shopping_list_items` while excluding normal deletes for append-only tables in `supabase/migrations/002_monthly_shopping_mvp_rls.sql`
- [x] T030 Add database comments documenting append-only expectations for `price_history` and `user_events` in `supabase/migrations/002_monthly_shopping_mvp_rls.sql`
- [x] T031 [P] Add RLS isolation test scenarios for all tables in `apps/mobile/tests/security/rls-policies.test.ts`

### Infrastructure and Cross-Cutting Contracts

- [x] T032 Create isolated Supabase client factory using only public env values in `apps/mobile/src/infrastructure/supabase/client.ts`
- [x] T033 Create Supabase auth/session adapter helpers in `apps/mobile/src/infrastructure/supabase/sessionStorage.ts`
- [x] T034 Add safe application error categories and mapper in `apps/mobile/src/shared/errors/appError.ts`
- [x] T035 [P] Add safe logger that strips sensitive metadata in `apps/mobile/src/shared/logging/logger.ts`
- [x] T036 [P] Add money and percentage formatting helpers in `apps/mobile/src/shared/formatters/money.ts`
- [x] T037 Add repository port barrel file in `apps/mobile/src/application/ports/index.ts`
- [x] T038 Add `AuthRepository` port in `apps/mobile/src/application/ports/AuthRepository.ts`
- [x] T039 Add `ShoppingListRepository` port in `apps/mobile/src/application/ports/ShoppingListRepository.ts`
- [x] T040 Add `ProductRepository` port in `apps/mobile/src/application/ports/ProductRepository.ts`
- [x] T041 Add `ShoppingListItemRepository` port in `apps/mobile/src/application/ports/ShoppingListItemRepository.ts`
- [x] T042 Add `PriceHistoryRepository` port in `apps/mobile/src/application/ports/PriceHistoryRepository.ts`
- [x] T043 Add `UserEventRepository` port in `apps/mobile/src/application/ports/UserEventRepository.ts`
- [x] T044 Add repository dependency container factory in `apps/mobile/src/application/ports/repositoryContainer.ts`
- [x] T045 Add DB row DTO types for all Phase 1 tables in `apps/mobile/src/infrastructure/supabase/database.types.ts`
- [x] T046 Add shared event type constants and metadata shape exports in `packages/shared/src/events/userEvents.ts`
- [x] T047 Add shared shopping status type exports in `packages/shared/src/domain-types/shopping.ts`

### Domain Primitives and Validation

- [x] T048 [P] Add `Money` value object with decimal normalization in `apps/mobile/src/domain/value-objects/Money.ts`
- [x] T049 [P] Add `Quantity` value object with positive decimal validation in `apps/mobile/src/domain/value-objects/Quantity.ts`
- [x] T050 [P] Add shopping list status domain type in `apps/mobile/src/domain/value-objects/ShoppingListStatus.ts`
- [x] T051 [P] Add user event type domain constants in `apps/mobile/src/domain/events/UserEventType.ts`
- [x] T052 Add auth form Zod schemas in `apps/mobile/src/features/auth/auth.schemas.ts`
- [x] T053 Add shopping list form Zod schemas in `apps/mobile/src/features/shopping-list/shoppingList.schemas.ts`
- [x] T054 Add product form Zod schemas in `apps/mobile/src/features/products/product.schemas.ts`
- [x] T055 Add item form Zod schemas in `apps/mobile/src/features/shopping-list-items/item.schemas.ts`
- [x] T056 Add validation error mapper from Zod to app errors in `apps/mobile/src/shared/forms/zodErrorMapper.ts`

### App State, Query, and Auth Shell

- [x] T057 Add TanStack Query client factory and default error retry policy in `apps/mobile/src/application/query-keys/queryClient.ts`
- [x] T058 Add central query key factory matching the plan contract in `apps/mobile/src/application/query-keys/queryKeys.ts`
- [x] T059 Add bounded UI-only Zustand store for selected list and transient UI flags in `apps/mobile/src/shared/state/uiStore.ts`
- [x] T060 Add auth state provider interface and hook shell in `apps/mobile/src/features/auth/useAuthSession.ts`
- [x] T061 Add protected route group layout that redirects unauthenticated users in `apps/mobile/src/app/(app)/_layout.tsx`
- [x] T062 Add auth route group layout that redirects authenticated users in `apps/mobile/src/app/(auth)/_layout.tsx`

**Checkpoint**: Database, RLS, architecture boundaries, validation schemas, query foundation, and auth route protection are ready for user-story work.

---

## Phase 3: User Story 1 - Create and Track Monthly Shopping List (Priority: P1) MVP

**Goal**: A signed-in user can register/login, create a monthly shopping list, add priced items, and see budget totals and over-budget warnings update immediately.

**Independent Test**: Create account, sign in, create one active list with budget, add multiple items with quantity/unit price, and verify item totals, list totals, remaining amount, used percentage, and over-budget warning.

### Tests for User Story 1

- [x] T063 [P] [US1] Add domain tests for item total calculation in `apps/mobile/tests/unit/domain/shoppingListItem.test.ts`
- [x] T064 [P] [US1] Add domain tests for list total, remaining budget, percentage, and over-budget state in `apps/mobile/tests/unit/domain/shoppingListBudget.test.ts`
- [x] T065 [P] [US1] Add auth use-case tests for register/login/logout/session restore in `apps/mobile/tests/unit/application/authUseCases.test.ts`
- [x] T066 [P] [US1] Add shopping list use-case tests for create/list/detail/complete basics in `apps/mobile/tests/unit/application/shoppingListUseCases.test.ts`
- [x] T067 [P] [US1] Add item use-case tests for add/update/remove/check and budget recalculation in `apps/mobile/tests/unit/application/itemUseCases.test.ts`
- [x] T068 [P] [US1] Add mapper tests for list and item DB rows to domain objects in `apps/mobile/tests/unit/infrastructure/shoppingMappers.test.ts`
- [x] T069 [P] [US1] Add route smoke tests for auth redirects and active-list flow in `apps/mobile/tests/integration/routes-auth-list.test.tsx`

### Implementation for User Story 1

- [x] T070 [P] [US1] Implement `ShoppingListItem` entity with total calculation in `apps/mobile/src/domain/entities/ShoppingListItem.ts`
- [x] T071 [P] [US1] Implement `ShoppingList` entity with budget calculations and status transitions in `apps/mobile/src/domain/entities/ShoppingList.ts`
- [x] T072 [P] [US1] Implement `Product` entity with reusable product fields in `apps/mobile/src/domain/entities/Product.ts`
- [x] T073 [P] [US1] Implement `calculateShoppingListBudget` domain service in `apps/mobile/src/domain/services/budget.ts`
- [x] T074 [US1] Implement Supabase auth repository adapter in `apps/mobile/src/infrastructure/repositories/SupabaseAuthRepository.ts`
- [x] T075 [US1] Implement `RegisterUser`, `LoginUser`, `LogoutUser`, and `RestoreSession` use cases in `apps/mobile/src/application/use-cases/auth.ts`
- [x] T076 [US1] Implement auth TanStack Query hooks in `apps/mobile/src/features/auth/auth.queries.ts`
- [x] T077 [US1] Implement login form component with React Hook Form and Zod in `apps/mobile/src/features/auth/LoginForm.tsx`
- [x] T078 [US1] Implement register form component with React Hook Form and Zod in `apps/mobile/src/features/auth/RegisterForm.tsx`
- [x] T079 [US1] Implement login route screen in `apps/mobile/src/app/(auth)/login.tsx`
- [x] T080 [US1] Implement register route screen in `apps/mobile/src/app/(auth)/register.tsx`
- [x] T081 [US1] Implement list DB-to-domain mapper in `apps/mobile/src/infrastructure/mappers/shoppingListMapper.ts`
- [x] T082 [US1] Implement item DB-to-domain mapper in `apps/mobile/src/infrastructure/mappers/shoppingListItemMapper.ts`
- [x] T083 [US1] Implement product DB-to-domain mapper subset needed for item display in `apps/mobile/src/infrastructure/mappers/productMapper.ts`
- [x] T084 [US1] Implement Supabase shopping list repository create/list/detail/complete/archive methods in `apps/mobile/src/infrastructure/repositories/SupabaseShoppingListRepository.ts`
- [x] T085 [US1] Implement Supabase shopping list item repository add/update/remove/check/list methods in `apps/mobile/src/infrastructure/repositories/SupabaseShoppingListItemRepository.ts`
- [x] T086 [US1] Implement minimal Supabase product repository create/get methods needed by item entry in `apps/mobile/src/infrastructure/repositories/SupabaseProductRepository.ts`
- [x] T087 [US1] Implement `CreateShoppingList`, `ListShoppingLists`, `GetShoppingListDetails`, `CompleteShoppingList`, and `ArchiveShoppingList` use cases in `apps/mobile/src/application/use-cases/shoppingLists.ts`
- [x] T088 [US1] Implement `AddShoppingListItem`, `UpdateShoppingListItem`, `RemoveShoppingListItem`, and `CheckShoppingListItem` use cases without history/events side effects in `apps/mobile/src/application/use-cases/shoppingListItems.ts`
- [x] T089 [US1] Implement shopping list query hooks and cache invalidation in `apps/mobile/src/features/shopping-list/shoppingList.queries.ts`
- [x] T090 [US1] Implement shopping list item query hooks and cache invalidation in `apps/mobile/src/features/shopping-list-items/item.queries.ts`
- [x] T091 [US1] Implement shopping list form component in `apps/mobile/src/features/shopping-list/ShoppingListForm.tsx`
- [x] T092 [US1] Implement budget summary component with total, remaining, percentage, and over-budget state in `apps/mobile/src/features/shopping-list/BudgetSummary.tsx`
- [x] T093 [US1] Implement over-budget alert component in `apps/mobile/src/features/shopping-list/OverBudgetAlert.tsx`
- [x] T094 [US1] Implement shopping list card component in `apps/mobile/src/features/shopping-list/ShoppingListCard.tsx`
- [x] T095 [US1] Implement shopping item row component with bought toggle and remove action in `apps/mobile/src/features/shopping-list-items/ShoppingListItemRow.tsx`
- [x] T096 [US1] Implement item form component for quantity and unit price in `apps/mobile/src/features/shopping-list-items/ShoppingListItemForm.tsx`
- [x] T097 [US1] Implement home/list overview route in `apps/mobile/src/app/(app)/index.tsx`
- [x] T098 [US1] Implement create list route in `apps/mobile/src/app/(app)/lists/new.tsx`
- [x] T099 [US1] Implement list detail route with budget summary and item list in `apps/mobile/src/app/(app)/lists/[listId].tsx`
- [x] T100 [US1] Implement add item route using reusable item form in `apps/mobile/src/app/(app)/lists/[listId]/item-new.tsx`
- [x] T101 [US1] Implement edit item route using reusable item form in `apps/mobile/src/app/(app)/lists/[listId]/item-[itemId].tsx`
- [x] T102 [US1] Add loading, empty, error, and retry states for auth/list/item flows in `apps/mobile/src/shared/feedback/AsyncState.tsx`
- [x] T103 [US1] Wire logout action into protected app layout in `apps/mobile/src/app/(app)/_layout.tsx`

**Checkpoint**: US1 is complete when a user can authenticate, create a list, add/edit/remove/check items, and see correct budget totals and warnings without price insight or event analytics.

---

## Phase 4: User Story 2 - Reuse Products and Compare Prices (Priority: P2)

**Goal**: A signed-in user can create reusable products, record price history, and compare current prices against the latest previous product price.

**Independent Test**: Create a product, record a price on one list, reuse the product on another item, and verify more-expensive, cheaper, unchanged, and no-history comparison states with absolute and percentage differences.

### Tests for User Story 2

- [ ] T104 [P] [US2] Add domain tests for product validation and duplicate candidate behavior in `apps/mobile/tests/unit/domain/product.test.ts`
- [ ] T105 [P] [US2] Add domain tests for price comparison states and difference calculations in `apps/mobile/tests/unit/domain/priceInsight.test.ts`
- [ ] T106 [P] [US2] Add use-case tests for product creation and search in `apps/mobile/tests/unit/application/productUseCases.test.ts`
- [ ] T107 [P] [US2] Add use-case tests for append-only price recording and latest previous price lookup in `apps/mobile/tests/unit/application/priceHistoryUseCases.test.ts`
- [ ] T108 [P] [US2] Add mapper tests for products and price history rows in `apps/mobile/tests/unit/infrastructure/productPriceMappers.test.ts`
- [ ] T109 [P] [US2] Add integration tests for item price save creating history and price insight refresh in `apps/mobile/tests/integration/price-history-flow.test.ts`

### Implementation for User Story 2

- [ ] T110 [P] [US2] Implement `PriceHistory` entity and append-only factory in `apps/mobile/src/domain/entities/PriceHistory.ts`
- [ ] T111 [P] [US2] Implement price comparison domain service in `apps/mobile/src/domain/services/priceInsight.ts`
- [ ] T112 [US2] Extend Supabase product repository with search/list/duplicate-candidate methods in `apps/mobile/src/infrastructure/repositories/SupabaseProductRepository.ts`
- [ ] T113 [US2] Implement price history DB-to-domain mapper in `apps/mobile/src/infrastructure/mappers/priceHistoryMapper.ts`
- [ ] T114 [US2] Implement Supabase price history repository append/latest/list methods in `apps/mobile/src/infrastructure/repositories/SupabasePriceHistoryRepository.ts`
- [ ] T115 [US2] Implement `CreateProduct` and product search use cases in `apps/mobile/src/application/use-cases/products.ts`
- [ ] T116 [US2] Implement `RecordPriceHistory`, `GetPreviousProductPrice`, and `CalculatePriceInsight` use cases in `apps/mobile/src/application/use-cases/priceHistory.ts`
- [ ] T117 [US2] Update item add/update use cases to append price history when unit price is inserted or changed in `apps/mobile/src/application/use-cases/shoppingListItems.ts`
- [ ] T118 [US2] Implement product query hooks for create/search/get in `apps/mobile/src/features/products/product.queries.ts`
- [ ] T119 [US2] Implement price history and insight query hooks in `apps/mobile/src/features/price-history/priceHistory.queries.ts`
- [ ] T120 [US2] Implement product form component with optional brand/barcode/unit in `apps/mobile/src/features/products/ProductForm.tsx`
- [ ] T121 [US2] Implement product picker component for item forms in `apps/mobile/src/features/products/ProductPicker.tsx`
- [ ] T122 [US2] Implement price comparison indicator component in `apps/mobile/src/features/insights/PriceComparisonIndicator.tsx`
- [ ] T123 [US2] Update item form to support selecting or creating reusable products in `apps/mobile/src/features/shopping-list-items/ShoppingListItemForm.tsx`
- [ ] T124 [US2] Update add item route to show latest previous price and comparison feedback in `apps/mobile/src/app/(app)/lists/[listId]/item-new.tsx`
- [ ] T125 [US2] Update edit item route to show price comparison when unit price changes in `apps/mobile/src/app/(app)/lists/[listId]/item-[itemId].tsx`
- [ ] T126 [US2] Implement create product route in `apps/mobile/src/app/(app)/products/new.tsx`
- [ ] T127 [US2] Implement simple list insights route for price comparison states in `apps/mobile/src/app/(app)/lists/[listId]/insights.tsx`
- [ ] T128 [US2] Add product duplicate guidance feedback in `apps/mobile/src/features/products/DuplicateProductNotice.tsx`

**Checkpoint**: US2 is complete when product reuse, price history append, latest-price lookup, and comparison UI work independently on top of US1.

---

## Phase 5: User Story 3 - Complete Lists and Preserve Audit Events (Priority: P3)

**Goal**: A signed-in user can mark items and lists completed while successful business actions create safe, structured events for audit and future AI readiness.

**Independent Test**: Mark items as bought, complete and archive lists, and verify required event rows are recorded with safe metadata and correct user/entity references.

### Tests for User Story 3

- [ ] T129 [P] [US3] Add domain tests for user event metadata safety and supported event types in `apps/mobile/tests/unit/domain/userEvent.test.ts`
- [ ] T130 [P] [US3] Add use-case tests for list completion and item checked event recording in `apps/mobile/tests/unit/application/eventUseCases.test.ts`
- [ ] T131 [P] [US3] Add integration tests for ITEM_ADDED, ITEM_UPDATED, ITEM_REMOVED, ITEM_CHECKED, PRICE_RECORDED, and SHOPPING_LIST_COMPLETED events in `apps/mobile/tests/integration/user-events-flow.test.ts`
- [ ] T132 [P] [US3] Add security tests that event metadata excludes tokens/session payloads in `apps/mobile/tests/security/user-events-metadata.test.ts`

### Implementation for User Story 3

- [ ] T133 [P] [US3] Implement `UserEvent` entity and metadata sanitizer in `apps/mobile/src/domain/entities/UserEvent.ts`
- [ ] T134 [P] [US3] Implement event metadata builders for list/product/item/price events in `apps/mobile/src/domain/events/eventMetadata.ts`
- [ ] T135 [US3] Implement user event DB-to-domain mapper in `apps/mobile/src/infrastructure/mappers/userEventMapper.ts`
- [ ] T136 [US3] Implement Supabase user event repository append method in `apps/mobile/src/infrastructure/repositories/SupabaseUserEventRepository.ts`
- [ ] T137 [US3] Implement `RecordUserEvent` use case in `apps/mobile/src/application/use-cases/userEvents.ts`
- [ ] T138 [US3] Update `CreateShoppingList` and `CompleteShoppingList` use cases to record list events in `apps/mobile/src/application/use-cases/shoppingLists.ts`
- [ ] T139 [US3] Update `CreateProduct` use case to record PRODUCT_CREATED in `apps/mobile/src/application/use-cases/products.ts`
- [ ] T140 [US3] Update item add/update/remove/check use cases to record item events in `apps/mobile/src/application/use-cases/shoppingListItems.ts`
- [ ] T141 [US3] Update price history use cases to record PRICE_RECORDED with safe metadata in `apps/mobile/src/application/use-cases/priceHistory.ts`
- [ ] T142 [US3] Add complete-list action and confirmation UI to list detail route in `apps/mobile/src/app/(app)/lists/[listId].tsx`
- [ ] T143 [US3] Add archive-list action for completed lists in list overview route in `apps/mobile/src/app/(app)/index.tsx`
- [ ] T144 [US3] Add event-safe logging around successful critical use cases in `apps/mobile/src/shared/logging/logger.ts`

**Checkpoint**: US3 is complete when list/item completion flows work and every required successful action records an owned, safe UserEvent.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Harden the full MVP, validate security and architecture, and prepare for `/speckit-implement` completion review.

- [ ] T145 Add active-list Realtime subscription adapter scoped to authenticated list id in `apps/mobile/src/infrastructure/realtime/activeListSubscription.ts`
- [ ] T146 Wire active-list Realtime updates into list detail query cache in `apps/mobile/src/features/shopping-list/useActiveListRealtime.ts`
- [ ] T147 Add integration test for active-list Realtime cache patch behavior in `apps/mobile/tests/integration/active-list-realtime.test.ts`
- [ ] T148 Add static boundary test preventing `supabase/client` imports from route and component files in `apps/mobile/tests/security/no-supabase-ui-imports.test.ts`
- [ ] T149 Add security test for anon-key-only mobile configuration in `apps/mobile/tests/security/mobile-env.test.ts`
- [ ] T150 Add repository ownership tests for cross-user list/product/item/history access denial in `apps/mobile/tests/security/repository-ownership.test.ts`
- [ ] T151 Add append-only regression tests for price history and user events in `apps/mobile/tests/security/append-only-history-events.test.ts`
- [ ] T152 Add route smoke test for full US1 to US3 happy path in `apps/mobile/tests/integration/monthly-shopping-mvp-flow.test.tsx`
- [ ] T153 Audit all user-facing errors for safe messages in `apps/mobile/src/shared/errors/appError.ts`
- [ ] T154 Audit all logs for sensitive data exclusion in `apps/mobile/src/shared/logging/logger.ts`
- [ ] T155 Add accessibility labels and touch targets to list, item, budget, and comparison components in `apps/mobile/src/features`
- [ ] T156 Add README implementation notes for Supabase setup, env variables, and RLS validation in `README.md`
- [ ] T157 Run quickstart validation steps and record results in `specs/001-monthly-shopping-mvp/quickstart.md`
- [ ] T158 Run typecheck, lint, unit, integration, and security test commands and document any residual failures in `specs/001-monthly-shopping-mvp/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational; delivers MVP core.
- **US2 (Phase 4)**: Depends on Foundational and integrates with US1 item flows for visible product reuse/history.
- **US3 (Phase 5)**: Depends on Foundational and integrates with US1/US2 use cases for event side effects.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **US1**: Independent after Foundational; suggested MVP scope.
- **US2**: Can begin after Foundational for product/history domain and repositories, but UI integration depends on US1 item forms and routes.
- **US3**: Can begin after Foundational for UserEvent domain/repository, but event wiring depends on US1/US2 use cases.

### Within Each User Story

- Tests before implementation.
- Domain before application use cases.
- Repository ports before adapters.
- Mappers before repository adapters.
- Use cases before TanStack Query hooks and UI routes.
- UI routes after feature components.
- Story checkpoint before moving to the next priority if working sequentially.

## Parallel Opportunities

- Setup tasks T004-T009 can run in parallel after T001-T003.
- Foundational value objects, schemas, and ports T035-T056 can run in parallel after folders exist.
- US1 tests T063-T069 can run in parallel.
- US1 domain entities T070-T073 can run in parallel.
- US2 tests T104-T109 can run in parallel.
- US2 domain tasks T110-T111 can run in parallel with product/history mapper work after ports exist.
- US3 tests T129-T132 can run in parallel.
- US3 domain tasks T133-T134 can run in parallel.
- Polish tests T147-T152 can run in parallel after the related implementation exists.

## Parallel Example: User Story 1

```bash
Task: "T063 [US1] Add domain tests for item total calculation in apps/mobile/tests/unit/domain/shoppingListItem.test.ts"
Task: "T064 [US1] Add domain tests for list total, remaining budget, percentage, and over-budget state in apps/mobile/tests/unit/domain/shoppingListBudget.test.ts"
Task: "T065 [US1] Add auth use-case tests for register/login/logout/session restore in apps/mobile/tests/unit/application/authUseCases.test.ts"
Task: "T070 [US1] Implement ShoppingListItem entity with total calculation in apps/mobile/src/domain/entities/ShoppingListItem.ts"
Task: "T071 [US1] Implement ShoppingList entity with budget calculations and status transitions in apps/mobile/src/domain/entities/ShoppingList.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T104 [US2] Add domain tests for product validation and duplicate candidate behavior in apps/mobile/tests/unit/domain/product.test.ts"
Task: "T105 [US2] Add domain tests for price comparison states and difference calculations in apps/mobile/tests/unit/domain/priceInsight.test.ts"
Task: "T110 [US2] Implement PriceHistory entity and append-only factory in apps/mobile/src/domain/entities/PriceHistory.ts"
Task: "T111 [US2] Implement price comparison domain service in apps/mobile/src/domain/services/priceInsight.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T129 [US3] Add domain tests for user event metadata safety and supported event types in apps/mobile/tests/unit/domain/userEvent.test.ts"
Task: "T132 [US3] Add security tests that event metadata excludes tokens/session payloads in apps/mobile/tests/security/user-events-metadata.test.ts"
Task: "T133 [US3] Implement UserEvent entity and metadata sanitizer in apps/mobile/src/domain/entities/UserEvent.ts"
Task: "T134 [US3] Implement event metadata builders for list/product/item/price events in apps/mobile/src/domain/events/eventMetadata.ts"
```

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 Setup.
2. Complete Phase 2 Foundational.
3. Complete Phase 3 US1.
4. Validate authentication, list creation, item entry, budget totals, and over-budget warning.
5. Stop for demo or continue to US2.

### Incremental Delivery

1. Setup + Foundational: architecture, Supabase/RLS, ports, schemas, query/auth shell.
2. US1: usable monthly list and budget MVP.
3. US2: reusable products, price history, simple price insight.
4. US3: completion/archive flows and future-AI event capture.
5. Polish: Realtime, hardening, validation, documentation.

### Out-of-Scope Guardrails

- Do not add LLM, autonomous agent, NestJS/backend API, barcode scanner, OCR, price scraping, push notifications, full offline mode, household multi-user features, Redux, or a Tamagui replacement.
- Do not call Supabase directly from UI route/component files.
- Do not store server state in Zustand.
- Do not overwrite price history or user events in normal app flows.

## Task Count Summary

- Total tasks: 158
- Setup: 18
- Foundational: 44
- US1: 41
- US2: 25
- US3: 16
- Polish: 14
