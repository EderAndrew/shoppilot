# Research: Monthly Shopping MVP

## Decision: Keep Supabase Direct Only Behind Infrastructure Adapters

**Rationale**: Phase 1 requires Supabase Auth, Postgres, and Realtime, but the
constitution requires future backend readiness. Repository ports in Application
let the app use Supabase now and later replace adapters with HTTP calls.

**Alternatives considered**:

- Direct Supabase calls from screens: rejected because it violates layering and
  makes future backend migration expensive.
- Build NestJS now: rejected because it is explicitly out of scope for Phase 1.

## Decision: Use Clean Architecture Boundaries Inside `apps/mobile/src`

**Rationale**: The existing Expo app is small, so feature folders alone would
invite business logic in UI. Explicit `domain`, `application`, and
`infrastructure` directories make dependencies and task ownership obvious.

**Alternatives considered**:

- Route-centric implementation only: rejected because domain rules would scatter
  across screens and hooks.
- Full multi-package domain split immediately: deferred until shared usage with a
  backend exists.

## Decision: Add Only Minimal Missing Dependencies During Implementation Tasks

**Rationale**: The current mobile package does not show the Supabase client or a
secure session storage dependency, but Supabase Auth and secure session
persistence are mandatory. Tasks should add only the required Supabase client and
secure storage support, plus a focused test runner if absent.

**Alternatives considered**:

- Install a broad app toolkit: rejected as unnecessary.
- Store sessions in insecure plain storage: rejected by OWASP and constitution
  requirements.

## Decision: Domain Math Owns Budget and Price Insight Calculations

**Rationale**: Totals, remaining budget, used percentage, over-budget state, and
price comparisons are business rules. Keeping them in pure domain services makes
them independently testable and reusable by future API code.

**Alternatives considered**:

- Calculate totals in UI hooks: rejected because UI must not own business logic.
- Persist derived totals as authoritative values: rejected because derived values
  can drift; they may be cached/displayed but domain remains authoritative.

## Decision: Append-Only Price History and User Events

**Rationale**: The spec and constitution require preserving historical data for
analytics and future AI. Price edits create new `price_history` rows, and
successful business actions create `user_events`.

**Alternatives considered**:

- Updating latest price in `products`: rejected because it loses temporal data.
- Event sourcing for all state: rejected as too complex for MVP; append-only
  supporting records are enough.

## Decision: RLS on Every User-Owned Table

**Rationale**: The product contains private shopping and price data. RLS with
`user_id = auth.uid()` is the primary database enforcement for ownership in the
MVP, backed by application validation.

**Alternatives considered**:

- Client-only ownership filtering: rejected because the client is untrusted.
- Service role from mobile: rejected because private keys must never ship to
  clients.

## Decision: TanStack Query Owns Server State

**Rationale**: Lists, products, items, price history, and session-derived reads
are server state. TanStack Query provides cache, invalidation, loading/error
states, and mutation lifecycle support without introducing Redux.

**Alternatives considered**:

- Zustand for shopping data: rejected because it would duplicate server state.
- Manual state management in screens: rejected because cache invalidation and
  refresh behavior would be inconsistent.

## Decision: Zustand Only for Simple UI State

**Rationale**: The MVP may need lightweight global UI state such as selected
list id, collapsed panels, or transient preferences. It must not become the
source of truth for shopping data.

**Alternatives considered**:

- No global UI store at all: possible, but keeping a small store is acceptable if
  strictly bounded.
- Redux: rejected by explicit constraint.

## Decision: React Hook Form and Zod for All User Input

**Rationale**: The current stack already includes both libraries. Zod schemas
can be reused across form boundaries, DTO validation, and application guards.

**Alternatives considered**:

- Hand-written validation per screen: rejected because it risks inconsistency.
- Adding another validation/form library: rejected as unnecessary.

## Decision: Realtime Only for the Active List

**Rationale**: Realtime is useful when a visible active list changes, especially
for totals and bought status. Broad subscriptions add complexity and battery/data
cost without clear MVP benefit.

**Alternatives considered**:

- No Realtime: acceptable fallback, but user requested real-time budget updates.
- Subscribe to all user data: rejected as unnecessary and harder to secure/test.

## Decision: Plan Focused Tests Before Broad UI Automation

**Rationale**: The highest-risk rules are domain calculations, ownership
isolation, append-only behavior, and mappers. These can be tested early and
cheaply before route/UI smoke tests exist.

**Alternatives considered**:

- UI-only manual QA: rejected because domain and security regressions need
  repeatable checks.
- Full end-to-end suite first: deferred because Phase 1 benefits more from
  focused domain and security tests.
