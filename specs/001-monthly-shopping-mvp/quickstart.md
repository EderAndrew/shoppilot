# Quickstart: Monthly Shopping MVP Planning Validation

This quickstart validates the implementation plan before `/speckit-tasks`.
It does not install dependencies or implement code.

## 1. Confirm Feature Context

From repository root:

```bash
git branch --show-current
cat .specify/feature.json
```

Expected:

- branch is `001-monthly-shopping-mvp`
- feature directory is `specs/001-monthly-shopping-mvp`

## 2. Review Required Inputs

Read:

```bash
sed -n '1,240p' specs/001-monthly-shopping-mvp/spec.md
sed -n '1,260p' specs/001-monthly-shopping-mvp/plan.md
sed -n '1,260p' specs/001-monthly-shopping-mvp/data-model.md
```

Validation:

- no unresolved `NEEDS CLARIFICATION`
- no task requires LLM, backend API, scanner, OCR, notifications, or full
  offline mode
- plan keeps Supabase isolated behind infrastructure adapters

## 3. Validate Current Mobile Stack

Read:

```bash
cat apps/mobile/package.json
cat apps/mobile/tsconfig.json
cat pnpm-workspace.yaml
```

Validation:

- Expo Router remains the entrypoint
- Tamagui remains the UI system
- TanStack Query is planned for server state
- Zustand is limited to UI state
- React Hook Form plus Zod are planned for forms and validation
- TypeScript strict mode remains enabled

## 4. Validate Architecture Boundaries

During task generation, ensure tasks create or preserve:

```text
apps/mobile/src/domain
apps/mobile/src/application
apps/mobile/src/infrastructure
apps/mobile/src/features
apps/mobile/src/shared
packages/shared
packages/config
```

Boundary checks:

- Domain imports no UI, Supabase, network, or framework-specific modules.
- UI route files do not import the Supabase client.
- Use cases depend on repository interfaces.
- Supabase adapters implement repository interfaces.

## 5. Validate Supabase/RLS Design

Review:

```bash
sed -n '1,260p' specs/001-monthly-shopping-mvp/contracts/supabase-contract.md
```

Validation:

- every table has `user_id`
- RLS is enabled on every user-owned table
- policies use `auth.uid()` ownership checks
- `price_history` and `user_events` are append-only in normal app flows
- mobile never uses a service role key

## 6. Validate Application Contracts

Review:

```bash
sed -n '1,260p' specs/001-monthly-shopping-mvp/contracts/application-contracts.md
```

Validation:

- every required use case has a clear boundary
- query keys avoid sensitive values
- errors are safe for users
- route contracts cover auth, list overview, list detail, item forms, product
  creation, and insights

## 7. Expected Task Generation Focus

The next `/speckit-tasks` run should produce tasks in this rough order:

1. mobile/monorepo foundation
2. Supabase migrations and RLS
3. authentication
4. domain entities and tests
5. repository ports, adapters, and use cases
6. TanStack Query hooks and cache invalidation
7. Expo Router screens
8. Tamagui UI components
9. price history and insights
10. user events
11. Realtime for active list only
12. hardening and validation tests

## 8. Success Check Before Tasks

The plan is ready for tasks when:

- `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and `contracts/`
  exist
- Constitution Check is PASS before and after design
- no plan artifact contains unresolved clarification markers
- out-of-scope items remain excluded
- no runtime code has been implemented as part of planning

## 9. Implementation Validation Results

Recorded on 2026-05-05 after Phase 6 implementation:

- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm test`: PASS, 26 test files and 96 tests passed
- `pnpm --filter mobile typecheck`: PASS
- `pnpm --filter mobile lint`: PASS
- `pnpm --filter mobile test`: PASS, 26 test files and 96 tests passed
- Prettier check for Phase 6 touched files: PASS
- `pnpm format:check`: residual FAIL because pre-existing `.agents`,
  `.specify`, Expo starter, and several planning files are not currently
  formatted by the repository-wide Prettier config. Phase 6 touched files were
  formatted and checked separately.

Security and architecture validation now includes static UI boundary checks,
anon-key-only mobile env checks, repository ownership checks, append-only
history/event checks, active-list Realtime cache patch checks, and a full
US1-US3 happy-path smoke test.
