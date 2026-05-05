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

Active plan: `specs/001-monthly-shopping-mvp/plan.md`

| Area                                                               | Status    |
| ------------------------------------------------------------------ | --------- |
| Monorepo, Expo, Tamagui, TanStack Query, lint/test/typecheck setup | Done      |
| Supabase schema and RLS migrations for Phase 1 tables              | Done      |
| Auth, protected routes, shopping lists, item entry, budget totals  | Done      |
| Product reuse, price history, and price comparison UI              | Done      |
| User events for auditability and future AI readiness               | Done      |
| Realtime, hardening, accessibility, and full MVP smoke coverage    | Remaining |

Phase 1 focuses on single-user monthly grocery shopping. Barcode scanning, OCR,
push notifications, full offline mode, multi-user households, LLM features, and
a dedicated backend are out of scope for this phase.

## MVP Capabilities

- Register, login, logout, and restore authenticated mobile sessions.
- Create, complete, and archive monthly shopping lists.
- Add, edit, remove, and check priced shopping list items.
- Track list total, remaining budget, used percentage, and over-budget state.
- Create and search reusable products with duplicate guidance.
- Record append-only price history when item prices are created or changed.
- Compare current item prices against the latest previous product price.
- Record append-only user events for critical list, item, product, and price
  actions using sanitized metadata.

## Tech Stack

- pnpm workspace monorepo
- Expo, React Native, Expo Router, and TypeScript
- Tamagui for UI
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
    src/domain/           Pure entities, value objects, and domain services
    src/application/      Use cases, repository ports, and query keys
    src/infrastructure/   Supabase clients, repositories, mappers, realtime
    src/features/         Feature hooks, schemas, screens, and components
    src/shared/           Providers, formatting, errors, logging, UI state
packages/
  config/                 Shared environment parsing and config contracts
  shared/                 Shared domain/event types
supabase/
  migrations/             Phase 1 schema and RLS migrations
specs/
  001-monthly-shopping-mvp/
```

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

## Feature Documentation

- Feature spec: `specs/001-monthly-shopping-mvp/spec.md`
- Implementation plan: `specs/001-monthly-shopping-mvp/plan.md`
- Data model: `specs/001-monthly-shopping-mvp/data-model.md`
- Application contracts:
  `specs/001-monthly-shopping-mvp/contracts/application-contracts.md`
- Supabase contract:
  `specs/001-monthly-shopping-mvp/contracts/supabase-contract.md`
- Task list: `specs/001-monthly-shopping-mvp/tasks.md`
