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

# Iterate on mobile tests only
pnpm --filter mobile test
pnpm --filter mobile test:watch

# Format
pnpm format
```

## Repository Layout

pnpm workspace monorepo. The only active app is `apps/mobile` (Expo + React Native + Web). `apps/api` is a future placeholder.

```
apps/mobile/src/
  app/              Expo Router screens — auth stack (login, register) + protected stack (tabs + product modal)
  domain/           Pure TypeScript — entities, value objects, budget/total/validation rules
  application/      Use cases, repository port interfaces, TanStack Query keys
  infrastructure/   All Supabase code: clients, repository adapters, mappers, Realtime
  features/         Feature-specific hooks, schemas, screens, and components
  shared/
    design-system/  tokens.ts, themes.ts, variants.ts — Tamagui visual foundation
    ui/             Shared primitives: ScreenContainer, AppCard, AppButton, AppInput, etc.
    feedback/       Async state helpers
packages/
  config/           Zod-based environment config shared across workspace
  shared/           Shared domain/event types
supabase/migrations/ Phase 1 schema (001) and RLS (002) — applied in order
specs/              Feature specs, plans, data model, and application/Supabase contracts
```

## Architecture Rules

**Layering** — Routes and components call feature hooks and application use cases. Use cases depend on repository *interfaces* (ports), not on Supabase directly. All Supabase-specific code lives in `src/infrastructure`. Domain code is framework-free.

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

## Supabase Tables (Phase 1)

`shopping_lists`, `products`, `shopping_list_items`, `price_history`, `user_events` — all scoped by `user_id`. Migrations in `supabase/migrations/` must be applied in order.

## Testing

Tests live in `apps/mobile/tests/`. Current focus is security-oriented tests (RLS policies, cross-user access denial, ownership validation, append-only invariants, metadata sanitization). Vitest runs in node environment.

## Feature Specs

Detailed specs, data models, and application/Supabase contracts are in `specs/`. Each numbered spec folder contains `spec.md`, `plan.md`, and supporting files.
