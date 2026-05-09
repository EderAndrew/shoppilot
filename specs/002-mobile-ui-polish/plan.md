# Implementation Plan: Mobile UI Polish

**Branch**: `002-mobile-ui-polish` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-mobile-ui-polish/spec.md`

## Summary

Create a low-risk UI/UX polish foundation for the Expo mobile app by centralizing Tamagui tokens, light theme decisions, reusable base components, shared visual states, and a gradual screen migration plan. The work intentionally avoids business-rule, API, navigation, and architecture changes. The implementation strategy prioritizes foundation first, then small screen-by-screen adoption with easy rollback at each step.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.1, React Native 0.81.5, Expo 54  
**Primary Dependencies**: Expo Router, Tamagui 2.0 rc, @tamagui/config v5, @tamagui/lucide-icons-2, Zustand, TanStack Query, React Hook Form, Zod  
**Storage**: No storage changes. Existing Supabase-backed repositories remain untouched behind application/infrastructure abstractions.  
**Testing**: `pnpm --filter mobile typecheck`, `pnpm --filter mobile lint`, `pnpm --filter mobile test`, targeted React Native Testing Library coverage for reusable UI/state components, manual Expo visual QA  
**Target Platform**: Expo mobile app targeting iOS, Android, and Expo web where currently supported  
**Project Type**: Mobile app in a monorepo  
**Performance Goals**: Preserve fast interaction feedback, avoid unnecessary re-renders in high-use shopping screens, keep UI components lightweight, and avoid heavy new dependencies  
**Constraints**: No new features, no navigation changes, no API/backend changes, no Tamagui replacement, no business-rule movement, no broad architecture refactor  
**Scale/Scope**: Existing mobile app screens under `apps/mobile/src/app`, feature components under `apps/mobile/src/features`, and shared UI primitives under `apps/mobile/src/shared`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Layering**: PASS. Work is presentation-layer polish only; domain, application, and infrastructure behavior remain unchanged.
- **Backend-ready data access**: PASS. No screen should add direct Supabase/database access; existing query/use-case boundaries remain intact.
- **Domain model**: PASS. This feature does not change ShoppingList, ShoppingListItem, Product, PriceHistory, or business behavior.
- **History and auditability**: PASS. No price, event, or history persistence changes are planned.
- **Security**: PASS. No auth, persistence, RLS, user ownership, secrets, or validation boundaries are changed.
- **Typing and shared models**: PASS. UI props and component contracts should be typed once and reused; domain models remain in existing layers.
- **Observability**: PASS. Existing logging/event behavior is preserved. UI error states should surface current errors without swallowing diagnostics.
- **Testing**: PASS. Plan includes focused UI/state tests plus existing app checks; no security/domain test scope is removed.
- **Action-oriented UX**: PASS. The entire feature improves fast, clear shopping interactions and immediate feedback.
- **AI readiness**: PASS. No relevant data/event capture is altered, so future analytics and AI readiness are preserved.

## Project Structure

### Documentation (this feature)

```text
specs/002-mobile-ui-polish/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── design-system-contract.md
│   └── visual-state-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/mobile/
├── tamagui.config.ts
├── src/
│   ├── app/                         # Expo Router screens; migrate gradually
│   ├── features/                    # Feature UI keeps behavior, adopts shared primitives
│   ├── shared/
│   │   ├── design-system/
│   │   │   ├── tokens.ts            # Color, spacing, radius, shadow, typography decisions
│   │   │   ├── themes.ts            # Light theme now, dark-ready semantic names
│   │   │   ├── variants.ts          # Button, input, card, list, state variants
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── Screen.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppCard.tsx
│   │   │   ├── AppButton.tsx
│   │   │   ├── AppInput.tsx
│   │   │   ├── AppListItem.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── index.ts
│   │   ├── feedback/                # Existing AsyncState can delegate to new state components
│   │   ├── forms/
│   │   ├── providers/
│   │   └── state/
│   ├── application/
│   ├── domain/
│   └── infrastructure/
└── tests/
    ├── integration/
    ├── security/
    └── unit/
```

**Structure Decision**: Keep the existing clean architecture and place the visual foundation under `apps/mobile/src/shared`. The proposed `shared/design-system` owns tokens, themes, and variants; `shared/ui` owns reusable presentational components. Feature folders remain responsible for feature composition and behavior, but they should consume shared UI primitives instead of duplicating style decisions.

## Complexity Tracking

No constitution violations or complexity exceptions are required.

## Incremental Delivery Strategy

### Phase 1 - Visual Audit Baseline

**Objective**: Inventory current screens, repeated components, inline styles, missing states, and visual inconsistencies before changing UI.
**Dependencies**: Current Expo app can run; existing screens compile.
**Deliverables**: Screen inventory, reusable component candidates, before screenshots for primary flows.
**Risks**: Audit becomes too broad.
**Rollback**: Documentation-only phase; no rollback needed.
**Impact Expected**: Clear migration order and reduced risk of accidental scope creep.
**Validation**: Every current primary screen is listed with its current states and candidate reusable components.

### Phase 2 - Tamagui Token and Theme Foundation

**Objective**: Centralize light-mode semantic tokens for color, spacing, radius, shadows, typography, and component variants.
**Dependencies**: Phase 1 audit; current `apps/mobile/tamagui.config.ts`.
**Deliverables**: Theme tokens, semantic color names, radius/spacing scale, typography scale, dark-ready naming.
**Risks**: Token changes can affect all Tamagui usages at once.
**Rollback**: Keep token changes in one commit and preserve default Tamagui fallback values until screens migrate.
**Impact Expected**: The app gains a consistent visual vocabulary without touching business behavior.
**Validation**: Typecheck passes; existing screens render with no missing token references.

### Phase 3 - Base Reusable Components

**Objective**: Create the shared primitives for `Screen`, `AppHeader`, `AppCard`, `AppButton`, `AppInput`, `AppListItem`, `EmptyState`, `LoadingState`, and `ErrorState`.
**Dependencies**: Phase 2 tokens and variants.
**Deliverables**: Typed reusable components with minimal props, accessibility labels supported, and no business logic.
**Risks**: Components become too generic or too feature-specific.
**Rollback**: Components are additive; screens can keep using current Tamagui primitives until adopted.
**Impact Expected**: Future screen work can reuse stable visual patterns and avoid duplicate styles.
**Validation**: Component tests cover loading/empty/error states, disabled buttons, form error rendering, and long text handling.

### Phase 4 - Layout and State Standardization

**Objective**: Replace one-off screen padding, headers, cards, list rows, and async feedback with shared components.
**Dependencies**: Phase 3 base components.
**Deliverables**: Updated shared `AsyncState` delegation, screen layout patterns, standardized state visuals.
**Risks**: Layout changes can create subtle overflow or spacing issues on small screens.
**Rollback**: Migrate by screen group; each screen can be reverted independently.
**Impact Expected**: Loading, error, and empty states become polished and predictable across the app.
**Validation**: Forced loading, empty, and error scenarios are visually checked on small and regular mobile viewports.

### Phase 5 - Gradual Screen Migration

**Objective**: Apply the visual foundation to existing screens in low-risk slices.
**Dependencies**: Phase 4 state and layout patterns.
**Delivery Order**:
1. Auth screens: login and register.
2. Shopping list overview and list cards.
3. List detail screen, item rows, and budget summaries.
4. Product create/picker screens and item forms.
5. Insights and price history screens.
**Risks**: Large visual diffs make regressions hard to isolate.
**Rollback**: One screen group per commit; preserve previous component usage until replacement is verified.
**Impact Expected**: Wireframe appearance decreases while flows remain familiar and fast.
**Validation**: Core flows require the same number of steps and all existing interaction tests continue to pass.

### Phase 6 - UX Refinement and Accessibility Review

**Objective**: Tune hierarchy, touch targets, text wrapping, contrast, icon use, focus/error states, and copy clarity.
**Dependencies**: Migrated screens.
**Deliverables**: Accessibility pass, contrast review, tap target review, long content review.
**Risks**: Over-polishing can add visual noise.
**Rollback**: Keep refinements scoped to tokens/variants first, screen overrides only when justified.
**Impact Expected**: More legible, calmer, faster shopping UI.
**Validation**: Primary actions identifiable in under 3 seconds; touch targets meet mobile usability expectations.

### Phase 7 - Final Visual Validation

**Objective**: Confirm consistency, performance, and compatibility across supported Expo targets.
**Dependencies**: All prior phases.
**Deliverables**: Final screenshot set, visual checklist, test run summary, known follow-ups.
**Risks**: Device-specific layout issues.
**Rollback**: Revert the smallest affected migration commit or token/variant change.
**Impact Expected**: A stable foundation ready for future screens and future dark mode.
**Validation**: Success criteria from the spec are met or documented with explicit follow-up.

## Rollback Strategy

- Keep foundational token/theme changes separate from screen migrations.
- Make base components additive before adopting them.
- Migrate one screen group at a time so regressions can be reverted without losing the foundation.
- Avoid deleting current feature behavior during migration; replace presentation wrappers only after parity is confirmed.
- Prefer token/variant rollback for visual regressions that affect many screens; prefer screen-level rollback for isolated layout issues.

## Visual Testing Strategy

- Capture before/after screenshots for auth, list overview, list detail, item form, product form, empty list, loading state, and error state.
- Force async states by using test/mocked query states where practical rather than changing production behavior.
- Use React Native Testing Library for reusable state and form component rendering contracts.
- Run `pnpm --filter mobile typecheck`, `pnpm --filter mobile lint`, and `pnpm --filter mobile test` after implementation slices.
- Manually validate Expo on at least one small mobile viewport and one regular mobile viewport.
- Check long product names, large prices, empty lists, failed mutation states, disabled actions, and completed/archived statuses.

## Token and Variant Strategy

- Use semantic token names such as `background`, `surface`, `surfaceElevated`, `textPrimary`, `textSecondary`, `borderSubtle`, `accent`, `success`, `warning`, and `danger`.
- Keep raw palette values private to the design-system files; screens and feature components should consume semantic names.
- Define component variants centrally for button intent, card emphasis, input status, list density, and visual state tone.
- Use light mode values first, but structure theme files so a future dark theme can map the same semantic names to different values.
- Avoid one-off inline styling for spacing, radius, colors, and shadows unless a component has a documented exception.

## Consistency Guardrails

- Shared UI components must remain presentational and avoid business rules, query calls, repository access, or navigation decisions unless explicitly passed as callbacks.
- Feature components may compose shared UI, but should not redefine the same visual treatment locally.
- New screen work should start from `Screen`, `AppHeader`, shared state components, and shared form/list primitives.
- Code review should flag raw color literals, duplicated card/list/input styles, and repeated loading/error/empty layouts.
- Future dark mode should be introduced by adding a new theme mapping, not by changing screen-level styles.

## Post-Design Constitution Check

- **Layering**: PASS. Design artifacts place visual work in `shared/design-system` and `shared/ui`; feature/domain/application/infrastructure boundaries remain intact.
- **Backend-ready data access**: PASS. UI contracts explicitly prohibit direct data-client access.
- **Domain model**: PASS. No domain model changes are introduced.
- **History and auditability**: PASS. Existing event and price history behavior remains untouched.
- **Security**: PASS. No persistence, auth, RLS, secrets, or ownership changes.
- **Typing and shared models**: PASS. Typed reusable UI props reduce duplicate presentation models.
- **Observability**: PASS. Existing error objects remain available to current logging/debugging paths; UI only presents safe messages.
- **Testing**: PASS. Plan includes UI contract tests, existing unit/integration/security checks, and manual visual QA.
- **Action-oriented UX**: PASS. Phases prioritize scanning, feedback, hierarchy, and low-step shopping flows.
- **AI readiness**: PASS. No historical/event data needed for future AI is removed or altered.
