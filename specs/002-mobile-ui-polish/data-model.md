# Data Model: Mobile UI Polish

This feature does not introduce persisted business data. The model below describes reusable presentation concepts and their relationships so the implementation can stay consistent without changing domain, application, infrastructure, API, or storage behavior.

## DesignTokenSet

**Represents**: The centralized visual vocabulary for the mobile app.

**Fields**:
- `colors`: Semantic roles for background, surface, text, border, accent, success, warning, and danger.
- `spacing`: A consistent layout rhythm for screen padding, groups, controls, and list rows.
- `radius`: Corner values for controls, cards, inputs, and state containers.
- `shadows`: Light depth treatments for elevated surfaces.
- `typography`: Font sizes, weights, and line-height choices for screen titles, section labels, body text, captions, and controls.

**Relationships**:
- Used by `ThemeDefinition`.
- Referenced by `ComponentVariant`.

**Validation Rules**:
- Tokens must use semantic names at the app usage boundary.
- Tokens must support the current light theme and preserve names that can be remapped for future dark mode.
- Raw palette values should remain centralized.

## ThemeDefinition

**Represents**: A named mapping from token roles to actual visual values.

**Fields**:
- `name`: Theme name, initially `light`.
- `backgroundRoles`: App background and surface mappings.
- `textRoles`: Primary, secondary, muted, inverse, and danger text mappings.
- `interactiveRoles`: Primary, secondary, disabled, success, warning, and destructive action mappings.
- `stateRoles`: Loading, empty, error, and success feedback mappings.

**Relationships**:
- Consumes `DesignTokenSet`.
- Drives `ComponentVariant` defaults.

**Validation Rules**:
- Light mode must be complete before screen migration.
- Names must be stable enough for a future dark theme to reuse.
- Theme changes must not require screen-level business changes.

## ComponentVariant

**Represents**: Shared visual variants for reusable UI primitives.

**Fields**:
- `component`: Button, input, card, list item, screen, header, or state component.
- `variant`: Visual intent such as primary, secondary, subtle, danger, elevated, outlined, compact, or spacious.
- `states`: Enabled, pressed, disabled, loading, invalid, selected, or completed.
- `accessibilityExpectations`: Minimum labeling, disabled state, and touch-target expectations.

**Relationships**:
- Consumes `DesignTokenSet` and `ThemeDefinition`.
- Used by `SharedUIComponent`.

**Validation Rules**:
- Variants must be centrally defined or documented.
- Variants must avoid feature-specific business behavior.
- Variants must preserve readable text and tappable controls on small screens.

## SharedUIComponent

**Represents**: A reusable presentational component used across screens and features.

**Fields**:
- `name`: Screen, AppHeader, AppCard, AppButton, AppInput, AppListItem, EmptyState, LoadingState, ErrorState, or AsyncState wrapper.
- `props`: Typed presentation inputs and callbacks.
- `allowedBehavior`: Rendering, layout, accessibility, visual feedback, and callback invocation.
- `forbiddenBehavior`: Business rules, query calls, repository access, direct persistence access, navigation decisions unless passed by caller.

**Relationships**:
- Uses `ComponentVariant`.
- Composed by feature components and route screens.

**Validation Rules**:
- Components must remain presentational.
- Components must support accessibility labels where the interaction is not self-evident.
- Components must handle long content without overlapping controls.

## ScreenMigrationSlice

**Represents**: A small, rollback-friendly group of screen updates.

**Fields**:
- `screenGroup`: Auth, list overview, list detail, forms, products, or insights.
- `scope`: Files/screens included in the slice.
- `dependencies`: Required tokens/components before migration.
- `rollbackUnit`: The smallest commit or file group that can be reverted safely.
- `validation`: Visual checks and test commands required for the slice.

**Relationships**:
- Applies `SharedUIComponent` to existing screens.
- Preserves existing feature queries, forms, navigation, and use cases.

**Validation Rules**:
- Each slice must preserve existing user flows and navigation destinations.
- Each slice must be testable independently.
- Each slice must not increase the number of required user steps.

## VisualStatePattern

**Represents**: Standard rendering for loading, empty, error, and success feedback.

**Fields**:
- `state`: Loading, empty, error, success, warning, or disabled.
- `message`: Safe user-facing explanation.
- `action`: Optional callback such as retry or create-first-item.
- `layout`: Reserved space and visual grouping rules.
- `tone`: Semantic visual treatment.

**Relationships**:
- Implemented by shared state components.
- Used by route screens and feature components through `AsyncState` or direct state components.

**Validation Rules**:
- Loading states should avoid confusing layout jumps.
- Empty states should explain what happened and suggest a next action when one exists.
- Error states should use safe language and offer recovery when possible.
