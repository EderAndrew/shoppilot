# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install
pnpm install

# Develop
pnpm mobile:start
pnpm mobile:ios
pnpm mobile:android
pnpm mobile:web

# Validate workspace
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check

# Run a single test file
pnpm --filter mobile test tests/unit/domain/budget.test.ts

# Iterate on mobile tests only
pnpm --filter mobile test
pnpm --filter mobile test:watch

# Format
pnpm format

# Export native builds
pnpm mobile:export:ios
pnpm mobile:export:android

# EAS builds (inside apps/mobile)
pnpm mobile:eas build

# Regenerate Supabase database types after schema changes
pnpm --filter mobile exec npx supabase gen types typescript --local > src/infrastructure/supabase/database.types.ts
```

## Repository Layout

pnpm workspace monorepo. The only active app is `apps/mobile` (Expo + React Native + Web). `apps/api` is a future placeholder.

```
apps/mobile/src/
  app/              Expo Router screens — auth stack + protected stack (tabs + product modal)
  domain/           Pure TypeScript — entities, value objects, budget/total/validation rules
  application/      Use cases, repository port interfaces, TanStack Query keys
  infrastructure/   All Supabase code: clients, repository adapters, mappers, Realtime
  features/         Feature-specific hooks, schemas, screens, and components
  shared/
    design-system/  tokens.ts, themes.ts, variants.ts — Tamagui visual foundation
    ui/             Shared primitives: ScreenContainer, AppCard, AppButton, AppInput, etc.
    feedback/       Async state helpers
    errors/         AppError class and toAppError() / getSafeErrorMessage() mappers
    logging/        logger.ts — structured logger (sanitizes tokens before output)
    formatters/     Currency, date, and other display formatters
    forms/          Shared react-hook-form helpers and field schemas
    state/          uiStore.ts — Zustand store for transient UI state
    providers/      AppProviders.tsx — TanStack Query + Tamagui provider tree
packages/
  config/           Zod-based environment config shared across workspace
  shared/           Shared domain/event types
supabase/
  migrations/       Phase 1 schema (001) and RLS (002) — applied in order
  functions/
    suggest-items/  AI shopping suggestions Edge Function (Deno runtime)
specs/              Feature specs, plans, data model, and application/Supabase contracts
```

## Screen Map

```
app/index.tsx                           → redirects to login or active lists
(auth)/login                            → LoginForm
(auth)/register                         → RegisterForm
(app)/_layout.tsx                       → auth guard; unauthenticated → login
(app)/(tabs)/lists/                     → active lists index, new list form
(app)/(tabs)/lists/[listId]/            → list detail with items, budget, AI assistant
(app)/(tabs)/lists/[listId]/insights    → price comparison view
(app)/(tabs)/lists/[listId]/item-new    → add item form
(app)/(tabs)/lists/[listId]/item-[id]   → edit item form
(app)/(tabs)/archived/                  → archived lists index
(app)/(tabs)/archived/[listId]/         → read-only archived list detail
(app)/(tabs)/user/                      → profile / logout
(app)/products/new                      → product creation modal (from item forms)
```

## Architecture Rules

**Layering** — Routes and components call feature hooks and application use cases. Use cases depend on repository *interfaces* (ports), not on Supabase directly. All Supabase-specific code lives in `src/infrastructure`. Domain code is framework-free.

**Feature hook pattern** — Feature query files (`features/*/\*.queries.ts`) instantiate use cases at module scope using `defaultRepositories`, then wrap them in TanStack Query hooks. Use cases are plain classes; hooks are the only React-aware layer. Example: `shoppingList.queries.ts` creates `listUseCases` at top-level and exports `useShoppingListsQuery`, `useCreateShoppingListMutation`, etc.

**State** — Shopping server state goes in TanStack Query. Zustand is only for transient UI state (selected list, collapsed sections). Never mix these responsibilities.

**Realtime** — Supabase Realtime subscriptions are opened only for the active list detail screen. Subscriptions must be removed on unmount; they patch the TanStack Query cache directly.

**Append-only tables** — `price_history` rows are created on item price creation or changes and never edited. `user_events` rows are appended only after successful business actions, with metadata sanitized before persistence or logging.

**Ownership** — Every repository adapter must set or preserve `user_id = auth.uid()` before persistence. Ownership cannot be reassigned through updates. RLS enforces this at the database layer.

**Credentials** — Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` belong in the mobile app environment. No service role key. Errors and logs must not expose tokens, raw sessions, or credentials.

**UI** — Route and feature components use shared primitives from `src/shared/ui/` and design tokens from `src/shared/design-system/`. Do not define one-off visual styles that duplicate these patterns.

## Environment Setup

Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## AI Assistant (Edge Function)

`supabase/functions/suggest-items/` runs on Deno. It validates the caller's JWT, calls Claude (`claude-haiku-4-5-20251001`), and returns structured JSON suggestions. The Anthropic API key never leaves the server — only the anon key is in the mobile bundle.

```bash
supabase secrets set ANTHROPIC_API_KEY=<your-key>
supabase functions deploy suggest-items
```

## Supabase Tables (Phase 1)

`shopping_lists`, `products`, `shopping_list_items`, `price_history`, `user_events` — all scoped by `user_id`. Migrations in `supabase/migrations/` must be applied in order.

## Testing

Tests live in `apps/mobile/tests/` across three tiers:

- **unit/** — domain entities/services, use case logic, infrastructure mappers
- **integration/** — auth + route flows, realtime subscription, multi-step scenarios
- **security/** — RLS policies, cross-user access denial, ownership invariants, append-only tables, metadata sanitization, env var exposure

Vitest runs in node environment with `@` aliased to `src/`. To run a single file:

```bash
pnpm --filter mobile test tests/security/rls-policies.test.ts
```

## Error Handling

All infrastructure code maps Supabase/provider errors through `toAppError()` from `src/shared/errors/appError.ts`. It translates HTTP status codes and Postgres error codes into typed `AppErrorCategory` values (`auth_required`, `not_found`, `conflict`, `validation_error`, `network_error`, `forbidden`, `unexpected`) and strips any message that matches credentials/SQL patterns before surfacing it to the UI. Always use `toAppError()` at infrastructure boundaries — never rethrow raw Supabase errors.

## Path Aliases

In both the app and vitest configs, `@` resolves to `apps/mobile/src/`. Workspace packages are aliased as `@shop-pilot/config` and `@shop-pilot/shared`.

## UI Language

All user-facing strings are in Brazilian Portuguese. New screens and error messages should follow this convention.

## Feature Specs

Detailed specs, data models, and application/Supabase contracts are in `specs/`. Each numbered spec folder contains `spec.md`, `plan.md`, and supporting files.
