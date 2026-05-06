# Research: Mobile UI Polish

## Decision: Foundation before screen migration

**Rationale**: The feature goal is consistency and low risk. Centralizing tokens, theme values, variants, and base components first allows every later screen change to be smaller and easier to review.

**Alternatives considered**:
- Migrate screens directly: rejected because it would duplicate styles and make rollback harder.
- Redesign all screens in one pass: rejected because it creates a large visual diff and higher regression risk.

## Decision: Keep Tamagui as the only UI foundation

**Rationale**: The app already uses Tamagui, and the user explicitly required keeping it. Extending the existing Tamagui config and wrapping common patterns in shared UI components gives a polished identity without adding heavy libraries or replacing the UI stack.

**Alternatives considered**:
- Add another design system library: rejected due to dependency weight and inconsistent component behavior.
- Use plain React Native styles everywhere: rejected because it would reduce reuse and bypass existing Tamagui patterns.

## Decision: Use semantic tokens with dark-mode-ready names

**Rationale**: Semantic names such as `surface`, `textPrimary`, `borderSubtle`, and `danger` let screens express intent instead of raw color choices. This supports light mode now and lets dark mode later remap the same semantic roles without touching most screens.

**Alternatives considered**:
- Raw palette tokens only: rejected because screens would know too much about color values.
- Screen-local color constants: rejected because it encourages drift.

## Decision: Shared UI primitives live under `apps/mobile/src/shared`

**Rationale**: The existing project already separates app, features, shared, application, domain, and infrastructure. Visual primitives are cross-feature presentation concerns, so they fit under `shared/design-system` and `shared/ui` without changing architecture.

**Alternatives considered**:
- Put design-system files inside each feature: rejected because it duplicates visual decisions.
- Create a new package immediately: rejected as unnecessary for the current scope and less rollback-friendly.

## Decision: Base components stay presentational

**Rationale**: Constitution rules prohibit business logic in UI components. Shared components should accept props, render consistent visuals, expose accessibility hooks, and call provided callbacks only.

**Alternatives considered**:
- Components that fetch or mutate data internally: rejected because it would break layering and make reuse harder.
- Highly generic components with many behavior props: rejected because they become hard to reason about and test.

## Decision: Screen migration order starts with low-risk surfaces

**Rationale**: Auth and list overview screens are visually important and relatively contained. Migrating them first proves the foundation before touching denser list-detail and item-management screens.

**Alternatives considered**:
- Start with the most complex list detail screen: rejected because it carries more layout and interaction risk.
- Migrate purely by component type across all screens: rejected because partial screen states can feel inconsistent longer.

## Decision: Visual states are standardized through shared components

**Rationale**: Loading, empty, and error feedback currently exists but is visually sparse. Centralizing `EmptyState`, `LoadingState`, `ErrorState`, and `AsyncState` composition improves polish while preserving existing query behavior.

**Alternatives considered**:
- Keep states inline per screen: rejected because state feedback would continue to drift.
- Replace server-state patterns: rejected because TanStack Query usage is outside this feature scope.

## Decision: Visual validation combines automated checks and manual Expo review

**Rationale**: Unit tests can verify contracts and state rendering, while visual polish still needs screenshots and human review on mobile viewports. This balances confidence with practical implementation cost.

**Alternatives considered**:
- Snapshot-only approval: rejected because snapshots can be noisy and poor at judging polish.
- Manual-only review: rejected because reusable component regressions are easy to miss.
