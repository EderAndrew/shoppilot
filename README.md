# ShopPilot

ShopPilot is a mobile-first grocery shopping MVP for monthly supermarket runs.
The app helps authenticated users create shopping lists, reuse products, add
priced items, compare current prices with previous purchases, track budget
totals, and preserve structured audit data for future agentic shopping
assistance.

The current implementation target is the Expo mobile app in `apps/mobile`.
Supabase is used directly for the MVP through infrastructure adapters, with the
application and domain layers kept isolated so a backend API can replace the
data source later without changing user-facing behavior.

## Current Status

| Area                                                               | Status |
| ------------------------------------------------------------------ | ------ |
| Monorepo, Expo, Tamagui, TanStack Query, lint/test/typecheck setup | Done   |
| Supabase schema and RLS migrations for Phase 1 tables              | Done   |
| Auth, protected routes, shopping lists, item entry, budget totals  | Done   |
| Product reuse, price history, and price comparison UI              | Done   |
| User events for auditability and future AI readiness               | Done   |
| Realtime, hardening, accessibility, and full MVP smoke coverage    | Done   |
| Mobile UI polish and shared design system foundation               | Done   |
| Tab bar navigation, archived lists screen, active list filtering   | Done   |

Phase 1 focuses on single-user monthly grocery shopping. Barcode scanning, OCR,
push notifications, full offline mode, multi-user households, LLM features, and
a dedicated backend are out of scope for this phase.

## MVP Capabilities

- Register, login, logout, and restore authenticated mobile sessions.
- Create, complete, and archive monthly shopping lists.
- Browse active lists and archived lists in dedicated tab bar screens.
- Add, edit, remove, and check priced shopping list items.
- Track list total, remaining budget, used percentage, and over-budget state.
- Create and search reusable products with inline suggestion and duplicate guidance.
- Record append-only price history when item prices are created or changed.
- Compare current item prices against the latest previous product price.
- Record append-only user events for critical list, item, product, and price
  actions using sanitized metadata.
- Subscribe to the opened active list and patch the TanStack Query cache when
  list/item changes arrive through Supabase Realtime.

## Tech Stack

- pnpm workspace monorepo
- Expo, React Native, Expo Router, and TypeScript
- Tamagui for UI (extended with a shared design system)
- TanStack Query for server state
- Zustand for small UI-only state
- React Hook Form and Zod for forms and validation
- Supabase Auth, Postgres, Realtime-ready schema, and RLS
- Vitest for unit, integration, and security-oriented tests

## Repository Layout

```text
apps/
  mobile/                 Expo mobile app
    src/app/              Expo Router routes
      (auth)/             Auth stack: login, register
      (app)/              Protected stack: tabs + product modal
        (tabs)/           Tab bar: lists, archived, user
    src/domain/           Pure entities, value objects, and domain services
    src/application/      Use cases, repository ports, and query keys
    src/infrastructure/   Supabase clients, repositories, mappers, realtime
    src/features/         Feature hooks, schemas, screens, and components
    src/shared/
      design-system/      Design tokens, themes, and Tamagui variants
      ui/                 Shared reusable UI components
      feedback/           Async state helpers
packages/
  config/                 Shared environment parsing and config contracts
  shared/                 Shared domain/event types
supabase/
  migrations/             Phase 1 schema and RLS migrations
specs/
  001-monthly-shopping-mvp/
  002-mobile-ui-polish/
  003-archived-lists-tabbar/
```

## Design System

`apps/mobile/src/shared/design-system/` defines the visual foundation:

- **tokens.ts** — color palette, spacing scale, border radii, shadows, and
  typography sizes.
- **themes.ts** — Tamagui theme mapping light-mode semantic tokens to design
  values.
- **variants.ts** — shared component variants for size, intent, and state.

`apps/mobile/src/shared/ui/` exports reusable interface primitives:

| Component               | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `ScreenContainer`       | Standard screen layout with safe-area padding        |
| `AppCard`               | Elevated content group with consistent border radius |
| `AppButton`             | Primary, secondary, and destructive button styles    |
| `AppInput`              | Text input with label, helper, and error states      |
| `AppListItem`           | Scannable list row with left/right content slots     |
| `SectionHeader`         | Section labels with consistent typography            |
| `EmptyState`            | Empty-state layout with message and optional action  |
| `LoadingState`          | Skeleton or spinner placeholder for async content    |
| `ErrorState`            | Error message with optional retry action             |
| `StatusState`           | Combined loading/empty/error switcher                |
| `FloatingActionButton`  | Primary floating action for list screens             |
| `InvalidFieldText`      | Field-level validation error text                    |

All existing primary screens and feature components have been updated to use
these shared primitives.

## Requirements

- Node.js compatible with the Expo SDK in this repo
- pnpm `10.33.0`
- Expo tooling for local mobile development
- Supabase project for auth and database-backed flows

Install dependencies:

```bash
pnpm install
```

## Environment

Create `apps/mobile/.env` with public Supabase mobile values only:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Do not add a Supabase service role key to the mobile app. The mobile runtime is
expected to use only anon/public configuration plus the authenticated user
session.

## Supabase Setup

Apply the migrations in order:

```text
supabase/migrations/001_monthly_shopping_mvp_schema.sql
supabase/migrations/002_monthly_shopping_mvp_rls.sql
```

The migrations define the Phase 1 tables:

- `shopping_lists`
- `products`
- `shopping_list_items`
- `price_history`
- `user_events`

Each table is scoped by `user_id`. RLS policies must keep reads and writes
limited to `auth.uid()`. `price_history` and `user_events` are append-only in
normal app flows.

Implementation notes:

- Run the mobile app with only `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` configured.
- Keep all direct Supabase calls inside `apps/mobile/src/infrastructure`.
- Repository adapters must set or preserve the authenticated user's ownership
  fields before persistence.
- `price_history` rows should be appended from item price creation or price
  changes; they should not be edited as part of normal app behavior.
- `user_events` rows should be appended after successful business actions only,
  with metadata sanitized before persistence or logging.
- Realtime subscriptions should be opened only for the authenticated active list
  detail screen and removed when that screen unmounts.

RLS validation should cover:

- a user can read and mutate only their own mutable rows;
- cross-user list, product, item, history, and event access is denied;
- inserts require `user_id = auth.uid()`;
- ownership cannot be reassigned through updates;
- append-only tables do not expose normal update/delete app flows.

## Development Commands

Run the mobile app:

```bash
pnpm mobile:start
pnpm mobile:ios
pnpm mobile:android
pnpm mobile:web
```

Validate the workspace:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
```

Run mobile tests directly when iterating on the app:

```bash
pnpm --filter mobile test
pnpm --filter mobile test:watch
```

Format files:

```bash
pnpm format
```

## Architecture Notes

- UI routes and components call feature hooks and application use cases.
- Use cases depend on repository interfaces, not directly on Supabase.
- Supabase-specific logic stays in `apps/mobile/src/infrastructure`.
- Domain code stays framework-free and owns budget, total, and validation rules.
- Price insight calculations live in domain services and are surfaced through
  feature hooks, not directly from route components.
- Critical successful actions should append `UserEvent` rows with safe metadata.
- Shopping server state belongs in TanStack Query, not Zustand.
- Zustand is reserved for transient UI state such as selected list and collapsed
  sections.
- Errors and logs should avoid tokens, raw sessions, credentials, and sensitive
  metadata.
- Shared UI primitives live in `src/shared/ui/`; design tokens and themes live
  in `src/shared/design-system/`. Route and feature components should not
  define one-off visual styles that duplicate these patterns.

## Feature Documentation

- Feature spec (Phase 1): `specs/001-monthly-shopping-mvp/spec.md`
- Implementation plan (Phase 1): `specs/001-monthly-shopping-mvp/plan.md`
- Feature spec (Phase 2 — UI Polish): `specs/002-mobile-ui-polish/spec.md`
- Implementation plan (Phase 2): `specs/002-mobile-ui-polish/plan.md`
- Feature spec (Phase 3 — Tab Bar & Archived Lists): `specs/003-archived-lists-tabbar/spec.md`
- Implementation plan (Phase 3): `specs/003-archived-lists-tabbar/plan.md`
- Data model: `specs/001-monthly-shopping-mvp/data-model.md`
- Application contracts:
  `specs/001-monthly-shopping-mvp/contracts/application-contracts.md`
- Supabase contract:
  `specs/001-monthly-shopping-mvp/contracts/supabase-contract.md`
