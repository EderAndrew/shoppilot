# ShopPilot

ShopPilot is a mobile-first grocery shopping MVP for monthly supermarket runs.
The app helps authenticated users create shopping lists, add priced items,
track budget totals, and preserve the data needed for future price insights and
agentic shopping assistance.

The current implementation target is the Expo mobile app in `apps/mobile`.
Supabase is used directly for the MVP through infrastructure adapters, with the
application and domain layers kept isolated so a backend API can replace the
data source later without changing user-facing behavior.

## Current Status

Active plan: `specs/001-monthly-shopping-mvp/plan.md`

| Area                                                               | Status  |
| ------------------------------------------------------------------ | ------- |
| Monorepo, Expo, Tamagui, TanStack Query, lint/test/typecheck setup | Done    |
| Supabase schema and RLS migrations for Phase 1 tables              | Done    |
| Auth, protected routes, shopping lists, item entry, budget totals  | Done    |
| Product reuse, price history, and price comparison UI              | Planned |
| User events, Realtime, hardening, and full MVP smoke coverage      | Planned |

Phase 1 focuses on single-user monthly grocery shopping. Barcode scanning, OCR,
push notifications, full offline mode, multi-user households, LLM features, and
a dedicated backend are out of scope for this phase.

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

Format files:

```bash
pnpm format
```

## Architecture Notes

- UI routes and components call feature hooks and application use cases.
- Use cases depend on repository interfaces, not directly on Supabase.
- Supabase-specific logic stays in `apps/mobile/src/infrastructure`.
- Domain code stays framework-free and owns budget, total, and validation rules.
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
