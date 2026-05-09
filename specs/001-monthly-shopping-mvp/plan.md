# Implementation Plan: Monthly Shopping MVP

**Branch**: `001-monthly-shopping-mvp` | **Date**: 2026-05-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-monthly-shopping-mvp/spec.md`

**Note**: This plan is produced by `/speckit-plan` and stops before task generation.
It does not implement code, install dependencies, or create runtime migrations.

## Summary

Build Phase 1 of the ShopPilot mobile MVP for monthly grocery shopping: users can
authenticate, create shopping lists, manage reusable products and list items,
track budget totals in real time, compare current prices with prior history, and
record append-only user events for future analytics and agentic AI.

The implementation will use the existing pnpm monorepo and `apps/mobile` Expo
app. The app will follow Clean Architecture with Presentation, Application,
Domain, and Infrastructure layers. Supabase is used directly during the MVP only
through infrastructure adapters and repository interfaces so a future backend API
can replace the data source without changing UI or domain behavior.

## Technical Context

**Language/Version**: TypeScript `~5.9.2`, React `19.1.0`, React Native `0.81.5`, Expo `~54.0.33`  
**Primary Dependencies**: Expo Router `~6.0.23`, Tamagui `2.0.0-rc.41`, Tamagui Lucide Icons `2.0.0-rc.26`, TanStack Query `^5.100.9`, Zustand `^5.0.12`, React Hook Form `^7.75.0`, Zod `^4.4.3`, React Native Reanimated `~4.1.7`, planned Supabase client dependency for Auth/Postgres/Realtime, planned secure session storage dependency if not already present  
**Storage**: Supabase Auth and Postgres with Realtime; local memory/cache only for client state; no full offline persistence in Phase 1  
**Testing**: Planned focused TypeScript domain tests, application/use-case tests, repository mapper tests, and Supabase RLS validation tests; current repo has no configured test runner  
**Target Platform**: Mobile app in `apps/mobile` for Expo-supported iOS and Android; web is not a Phase 1 acceptance target  
**Project Type**: pnpm workspace monorepo with mobile application plus shared/config packages  
**Performance Goals**: Budget totals update within 1 second for 95% of item mutations under normal mobile network conditions; primary in-market item check flow requires no more than 3 actions after opening a list  
**Constraints**: No Redux; do not replace Tamagui; no Supabase calls from UI components; use TanStack Query for server state; use Zustand only for simple UI/global state; forms use React Hook Form plus Zod; avoid unnecessary dependencies; secure session handling; RLS required for all user-owned tables  
**Scale/Scope**: Single-user accounts only; Phase 1 covers auth, lists, reusable products, list items, budget summary, price history, simple insights, and user events; excludes LLM, autonomous agents, backend API, OCR, barcode scanning, push notifications, full offline mode, marketplace comparison, and household multi-user collaboration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Layering**: PASS. Plan defines Presentation, Application, Domain, and
  Infrastructure under `apps/mobile/src`; domain contains pure entities and
  services only.
- **Backend-ready data access**: PASS. UI talks to hooks/use cases; use cases
  depend on repository interfaces; Supabase adapters live only in Infrastructure.
- **Domain model**: PASS. ShoppingList, ShoppingListItem, Product, PriceHistory,
  and UserEvent are explicit domain concepts with behavior and validation rules.
- **History and auditability**: PASS. Price history and user events are
  append-only by default; item edits never overwrite historical price records.
- **Security**: PASS. Every table includes `user_id`, RLS policies scope by
  `auth.uid()`, validation happens before persistence, and service role keys are
  prohibited in mobile.
- **Typing and shared models**: PASS. Domain types are TypeScript-first; stable
  shared contracts can move into `packages/shared` when used across boundaries.
- **Observability**: PASS. Successful critical actions create UserEvent records;
  operational logs avoid sensitive data and include only safe context.
- **Testing**: PASS. Domain budget and price comparison tests are mandatory;
  RLS/ownership and mapper tests are planned before feature completion.
- **Action-oriented UX**: PASS. Routes and components prioritize the active list,
  quick item entry, immediate budget feedback, and minimal in-market taps.
- **AI readiness**: PASS. PriceHistory and UserEvent capture structured data for
  later forecasting, suggestions, and agentic decision support.

## Project Structure

### Documentation (this feature)

```text
specs/001-monthly-shopping-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── application-contracts.md
│   └── supabase-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
└── mobile/
    ├── app/
    │   ├── _layout.tsx
    │   ├── (auth)/
    │   │   ├── login.tsx
    │   │   └── register.tsx
    │   └── (app)/
    │       ├── _layout.tsx
    │       ├── index.tsx
    │       ├── lists/
    │       │   ├── [listId].tsx
    │       │   ├── new.tsx
    │       │   └── [listId]/
    │       │       ├── item-new.tsx
    │       │       ├── item-[itemId].tsx
    │       │       └── insights.tsx
    │       └── products/
    │           └── new.tsx
    ├── src/
    │   ├── features/
    │   │   ├── auth/
    │   │   ├── shopping-list/
    │   │   ├── products/
    │   │   ├── shopping-list-items/
    │   │   ├── price-history/
    │   │   └── insights/
    │   ├── domain/
    │   │   ├── entities/
    │   │   ├── services/
    │   │   ├── value-objects/
    │   │   └── events/
    │   ├── application/
    │   │   ├── ports/
    │   │   ├── use-cases/
    │   │   └── query-keys/
    │   ├── infrastructure/
    │   │   ├── supabase/
    │   │   ├── repositories/
    │   │   ├── mappers/
    │   │   └── realtime/
    │   └── shared/
    │       ├── components/
    │       ├── forms/
    │       ├── feedback/
    │       ├── errors/
    │       └── logging/
    └── tests/
        ├── unit/
        ├── integration/
        └── security/

packages/
├── shared/
│   └── src/
│       ├── domain-types/
│       └── events/
└── config/
    └── src/
        ├── env/
        └── validation/
```

**Structure Decision**: Keep routes in `apps/mobile/app` for Expo Router and all
feature code under `apps/mobile/src`. Cross-cutting contracts that may be reused
by a future backend live in `packages/shared`; environment/config conventions
live in `packages/config`. The initial implementation may keep code local to
`apps/mobile` until a type is truly shared, but task generation must preserve the
boundaries shown above.

## Architecture and Data Flow

Presentation renders screens, forms, and feedback only. Screens call feature
hooks that wrap TanStack Query queries/mutations and application use cases.
Application use cases coordinate domain behavior and repository interfaces.
Domain entities/services calculate totals, remaining budget, used percentage,
budget exceeded state, price comparisons, and valid state transitions.
Infrastructure owns Supabase client setup, DTO mapping, repositories, Realtime
subscriptions, and safe error translation.

Data flow:

1. UI form collects user input and validates shape with feature schemas.
2. Feature hook calls a use case through TanStack Query mutation/query.
3. Use case validates domain invariants and calls repository interfaces.
4. Supabase repository adapter maps domain data to database DTOs.
5. Adapter persists data under the authenticated user's `user_id`.
6. Use case records price history and UserEvent where required.
7. Query cache invalidates or updates the active list, item, product, insight,
   and history queries.

Future backend migration path:

- Keep repository interfaces stable in `application/ports`.
- Replace Supabase repository adapters with HTTP API adapters.
- Preserve use cases, domain models, TanStack Query hooks, and UI contracts.
- Move shared DTO/event contracts to `packages/shared` when the backend appears.

## Database and Security Plan

Supabase migrations will define these tables: `shopping_lists`, `products`,
`shopping_list_items`, `price_history`, and `user_events`. Every table includes:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz` where records are mutable
- useful foreign keys and indexes for user-scoped reads
- check constraints for positive money/quantity values and supported statuses

RLS plan:

- Enable RLS on every user-owned table.
- SELECT policies allow rows where `user_id = auth.uid()`.
- INSERT policies require `user_id = auth.uid()`.
- UPDATE policies require `user_id = auth.uid()` and preserve ownership.
- DELETE policies are allowed only for mutable user-owned records that the spec
  permits users to remove; `price_history` and `user_events` are append-only for
  normal app flows and should not expose app-level delete behavior.
- The mobile app uses only anon/public client configuration and authenticated
  user sessions; service role keys are never present in mobile code.

Validation and logging:

- Zod validates form inputs and DTO boundaries before persistence.
- Domain validates invariants even if UI validation is bypassed.
- Errors shown to users are friendly and do not include sensitive details.
- Logs exclude tokens, raw session data, full metadata payloads, and personally
  sensitive values.

## Use Cases

- `RegisterUser`
- `LoginUser`
- `LogoutUser`
- `RestoreSession`
- `CreateShoppingList`
- `ListShoppingLists`
- `GetShoppingListDetails`
- `CompleteShoppingList`
- `ArchiveShoppingList`
- `CreateProduct`
- `AddShoppingListItem`
- `UpdateShoppingListItem`
- `RemoveShoppingListItem`
- `CheckShoppingListItem`
- `RecordPriceHistory`
- `GetPreviousProductPrice`
- `CalculatePriceInsight`
- `RecordUserEvent`

Use cases must be small and composable. Item add/update use cases are
responsible for coordinating item persistence, price-history recording, event
recording, and cache invalidation signals. Budget math remains in domain
entities/services.

## TanStack Query Plan

Query keys:

- `['auth', 'session']`
- `['shoppingLists']`
- `['shoppingList', listId]`
- `['shoppingListItems', listId]`
- `['products', searchTerm]`
- `['product', productId, 'latestPrice']`
- `['priceHistory', productId]`
- `['priceInsight', productId, currentPrice]`

Queries:

- current session restoration
- list all shopping lists for current user
- list detail with items and budget summary
- product search/list for reusable products
- latest previous price for a product
- simple price insight for item entry/edit screens

Mutations:

- register, login, logout
- create, complete, archive shopping list
- create product
- add, update, remove, check item
- record price history and user event through use cases, not standalone UI calls

Cache strategy:

- Invalidate list collection after list create/complete/archive.
- Invalidate list detail and items after item mutations.
- Invalidate product and latest-price queries after price recording.
- Use optimistic updates only for low-risk UI state such as item checked status
  when rollback behavior is clear.
- Prefer immediate derived domain recalculation from current query data for
  budget summary while the mutation is pending.

## Zustand Plan

Zustand is limited to UI state that is not authoritative server data:

- active selected list id when navigation state alone is insufficient
- transient UI preferences such as collapsed sections or last selected tab
- form-adjacent draft UI flags that should not be persisted as shopping data

Do not store shopping lists, products, items, price history, auth session, or
server-derived budget totals in Zustand.

## Forms and Validation Plan

Forms use React Hook Form plus Zod:

- Register form: email, password, optional display name if later needed.
- Login form: email and password.
- Shopping list form: name, budget.
- Product form: name, optional brand, optional barcode, optional unit.
- Item form: product selection or product creation path, quantity, unit price,
  bought status where relevant.

All numeric fields reject empty, zero, negative, and invalid decimal values.
Status fields accept only supported state values. Validation schemas should be
co-located with the feature but reusable by application/use-case boundaries.

## Routes and UI Plan

Expo Router routes:

- `(auth)/login`
- `(auth)/register`
- `(app)/index` for home/list overview
- `(app)/lists/new`
- `(app)/lists/[listId]`
- `(app)/lists/[listId]/item-new`
- `(app)/lists/[listId]/item-[itemId]`
- `(app)/products/new`
- `(app)/lists/[listId]/insights`

Tamagui components:

- list card with status, budget, total, and progress indicator
- shopping list form
- product form
- item form with quick product reuse
- shopping item row with bought toggle, quantity, price, and remove action
- budget summary with total, remaining amount, and used percentage
- over-budget alert
- price comparison indicator for more expensive, cheaper, unchanged, and no
  history
- loading, empty, error, and retry states for each primary route

UX rules:

- Optimize for one-handed use in a supermarket.
- Keep add/check item actions visible from list detail.
- Show immediate visual feedback after mutations.
- Keep destructive actions confirmable but not cumbersome.
- Avoid explanatory text that duplicates obvious UI controls.

## Realtime Plan

Use Supabase Realtime only for the active list where it creates clear value:

- subscribe to item changes for the currently opened list
- refresh or patch active list totals when item changes arrive
- unsubscribe when leaving the list detail route

Avoid Realtime for all lists, product catalog, and historical pages in Phase 1
unless tasks uncover a concrete need.

## Testing Plan

Priority domain tests:

- item total calculation
- list current total
- remaining budget
- used percentage
- over-budget detection
- latest previous price comparison
- unchanged/no-history price states
- append-only price history behavior at use-case level

Application/security tests:

- use cases call repositories through interfaces
- item add/update records price history and events
- cross-user repository calls cannot return or mutate another user's data
- mappers preserve ids, user ownership, money values, timestamps, and statuses
- RLS policies deny cross-user SELECT/INSERT/UPDATE/DELETE attempts

UI smoke tests may be deferred until the main flows exist, but the task list
must include route-level validation for auth redirects and active-list flows.

## Events for Future AI

Record these event types on successful actions:

- `SHOPPING_LIST_CREATED`
- `SHOPPING_LIST_COMPLETED`
- `PRODUCT_CREATED`
- `ITEM_ADDED`
- `ITEM_UPDATED`
- `ITEM_REMOVED`
- `ITEM_CHECKED`
- `PRICE_RECORDED`

Minimum metadata:

- shopping list events: `list_id`, `status`, `budget`
- product events: `product_id`, optional `brand`, optional `unit`
- item events: `list_id`, `item_id`, `product_id`, `quantity`, `unit_price`,
  `total_price`, `bought`
- price events: `product_id`, `list_id`, `price`, optional previous price,
  optional absolute and percentage difference

Metadata must avoid tokens, credentials, and unnecessary personal data.

## Out of Scope

- LLM features
- autonomous agents
- NestJS or any dedicated backend
- barcode scanner
- OCR
- supermarket-to-supermarket comparison
- push notifications
- complete offline mode
- household/family multi-user collaboration
- Redux
- replacing Tamagui

## Incremental Technical Plan

1. **Monorepo/mobile foundation**: confirm workspace scripts, path aliases,
   Tamagui provider, Expo Router layout, app providers, and environment loading.
2. **Supabase migrations and RLS**: create tables, constraints, indexes, RLS
   policies, and validation checklist for user isolation.
3. **Authentication foundation**: implement client isolation, secure session
   persistence, register/login/logout/restore flows, and protected route groups.
4. **Domain layer**: implement entities, value objects, domain services, event
   types, and focused tests for budget and price behavior.
5. **Repositories and use cases**: define ports, DTOs, mappers, Supabase
   adapters, and use cases for lists, products, items, history, insights, and
   events.
6. **Primary screens**: build auth, list overview, create list, list detail, add
   item, edit item, and create product routes with Tamagui components.
7. **History and insights**: record append-only price history and display simple
   comparison states with absolute and percentage difference.
8. **Events**: record user events consistently from successful use cases.
9. **Realtime and cache tuning**: add active-list subscriptions only where useful
   and align query invalidation/optimistic updates.
10. **Hardening and tests**: validate RLS, security errors, domain math,
    append-only behavior, auth redirects, no Supabase imports from UI, and no
    sensitive logging.

## Post-Design Constitution Check

- **Layering**: PASS. Structure and contracts keep UI, use cases, domain, and
  adapters separate.
- **Backend-ready data access**: PASS. Repository ports are the application
  boundary and can be backed by HTTP later.
- **Domain model**: PASS. Data model documents fields, relationships, state
  transitions, and domain rules.
- **History and auditability**: PASS. `price_history` and `user_events` are
  append-only in normal flows.
- **Security**: PASS. Supabase contract defines RLS, ownership, validation, and
  service-role prohibition.
- **Typing and shared models**: PASS. Contracts identify shared types and package
  placement without duplicating domain models.
- **Observability**: PASS. UserEvent metadata and safe logging rules are planned.
- **Testing**: PASS. Quickstart and task-ready test focus cover domain, use
  cases, mappers, and RLS.
- **Action-oriented UX**: PASS. Route/UI plan targets quick active-list actions.
- **AI readiness**: PASS. Price and event data are structured for future
  analytics and agentic features.

## Complexity Tracking

No constitution violations require justification.
