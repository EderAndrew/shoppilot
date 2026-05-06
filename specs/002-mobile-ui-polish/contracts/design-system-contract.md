# UI Contract: Design System Foundation

## Purpose

Define the presentation contract for the mobile design-system foundation. This contract protects the feature scope: visual polish only, no business-rule, navigation, API, backend, auth, persistence, or architecture changes.

## Required Modules

```text
apps/mobile/src/shared/design-system/
├── tokens.ts
├── themes.ts
├── variants.ts
└── index.ts

apps/mobile/src/shared/ui/
├── Screen.tsx
├── AppHeader.tsx
├── AppCard.tsx
├── AppButton.tsx
├── AppInput.tsx
├── AppListItem.tsx
├── EmptyState.tsx
├── LoadingState.tsx
├── ErrorState.tsx
└── index.ts
```

## Token Contract

- Tokens MUST be centralized and exported from `shared/design-system`.
- Screens and feature components SHOULD reference semantic names or shared variants instead of raw color values.
- Light theme MUST be complete before screen migration starts.
- Token names SHOULD be dark-mode-ready and avoid embedding light-only assumptions in usage sites.
- Token files MUST NOT import feature, application, domain, infrastructure, query, auth, or repository modules.

## Component Contract

Shared UI components MUST:
- Render presentation only.
- Accept typed props and callbacks.
- Support accessibility labels for icon-only or ambiguous actions.
- Use Tamagui primitives and centralized tokens/variants.
- Handle disabled, loading, invalid, and long-content states where relevant.
- Preserve touchable areas suitable for mobile use.

Shared UI components MUST NOT:
- Fetch data.
- Mutate data.
- Import Supabase or repository clients.
- Contain shopping business rules.
- Own navigation decisions unless a caller passes the callback.
- Introduce heavy UI dependencies.

## Variant Contract

- Button variants MUST include at least primary, secondary/subtle, and danger/destructive intent.
- Input variants MUST include normal, invalid, and disabled visual states.
- Card variants MUST include default and elevated/subtle emphasis where needed.
- List item variants MUST support normal, completed/checked, and actionable rows.
- State component variants MUST cover loading, empty, error, success, and warning tones.

## Migration Contract

- Foundation changes come before screen migration.
- Each screen group migration MUST be independently revertible.
- Existing navigation route strings and flow destinations MUST remain unchanged.
- Existing form validation schemas MUST remain unchanged.
- Existing query/mutation hooks MUST remain unchanged unless a later task proves a purely presentational wrapper is needed.
- Existing tests MUST continue to pass after each migration slice.
