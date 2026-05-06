# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the mobile app
pnpm mobile:start
pnpm mobile:ios
pnpm mobile:android

# Validate the workspace
pnpm typecheck        # runs tsc across all packages
pnpm lint             # eslint on mobile app
pnpm test             # vitest run on mobile app
pnpm format:check     # prettier check

# Iterate on tests in the mobile app
pnpm --filter mobile test
pnpm --filter mobile test:watch

# Run a single test file
pnpm --filter mobile test tests/unit/domain/budget.test.ts

# Format
pnpm format
```

## Architecture

This is a pnpm workspace monorepo. The primary implementation target is `apps/mobile` (Expo + React Native). Two workspace packages provide shared types: `@shop-pilot/shared` and `@shop-pilot/config`.

The mobile app follows a strict layered architecture. The `@` alias maps to `apps/mobile/src`.

### Layer boundaries (most to least abstract)

| Layer | Path | Rule |
|-------|------|------|
| **domain** | `src/domain/` | Pure TypeScript — no framework or Supabase imports. Owns entities, value objects (`Money`, `Quantity`, `ShoppingListStatus`), and domain services (`budget.ts`, `priceInsight.ts`). |
| **application** | `src/application/` | Use cases depend on repository port interfaces, never on Supabase directly. `RepositoryContainer` groups all ports. `queryKeys.ts` is the single source of truth for TanStack Query keys. |
| **infrastructure** | `src/infrastructure/` | All Supabase calls live here. Each repository implements its port. Mappers translate Supabase rows to domain entities. `defaultRepositories.ts` wires the singleton `RepositoryContainer`. Realtime subscriptions belong here too. |
| **features** | `src/features/` | Feature-scoped hooks (`*.queries.ts`), Zod schemas, and UI components. Hooks call application use cases and return TanStack Query results. |
| **app** | `src/app/` | Expo Router file-based routes. Route segments call feature hooks or use cases; they do not import from infrastructure directly. |
| **shared** | `src/shared/` | Cross-cutting utilities: `AppProviders`, Zustand `uiStore`, formatters, error types, logger. |

### Key invariants

- **Supabase stays in infrastructure.** No Supabase import outside `src/infrastructure/`.
- **Server state belongs in TanStack Query.** Zustand (`uiStore`) is only for transient UI state such as the selected list or collapsed sections.
- **`price_history` and `user_events` are append-only.** Repositories must never expose update/delete for these tables.
- **User events fire only after successful actions.** Metadata must be sanitized before persistence.
- **Realtime subscriptions are scoped to the active list detail screen** and cleaned up on unmount (`src/infrastructure/realtime/activeListSubscription.ts`).
- **Each repository receives an `AuthRepository`** so it can retrieve `auth.uid()` for ownership enforcement before any write.

### Tests

Tests live in `apps/mobile/tests/` split into three categories:

- `unit/` — pure domain logic and application use cases with mock repositories
- `integration/` — flow tests wiring real use cases with mock Supabase responses
- `security/` — ownership, RLS policy coverage, append-only enforcement, metadata sanitization, and env exposure checks

Vitest is configured in `apps/mobile/vitest.config.ts`. The `@` and `@shop-pilot/*` aliases are resolved there.

## Environment

Create `apps/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Never add a Supabase service role key to the mobile app.

## Supabase

Apply migrations in order from `supabase/migrations/`. Phase 1 tables: `shopping_lists`, `products`, `shopping_list_items`, `price_history`, `user_events`. All tables are scoped by `user_id`; RLS restricts reads and writes to `auth.uid()`.
