# Quickstart: Mobile UI Polish Planning

## Prerequisites

- Use Node from `.nvmrc` or any compatible Node 22 runtime.
- Install dependencies with the existing workspace package manager.
- Work from branch `002-mobile-ui-polish`.

## Recommended Implementation Order

1. Capture a visual audit of current screens and states.
2. Add `apps/mobile/src/shared/design-system` with centralized tokens, themes, and variants.
3. Update `apps/mobile/tamagui.config.ts` to consume the design-system foundation.
4. Add shared UI primitives under `apps/mobile/src/shared/ui`.
5. Update `AsyncState` to delegate to shared visual state components.
6. Migrate auth screens first.
7. Migrate shopping list overview and list card components.
8. Migrate list detail, item rows, budget summaries, and alerts.
9. Migrate forms, product screens, insights, and price-history surfaces.
10. Run accessibility, visual, type, lint, and test validation.

## Validation Commands

```bash
pnpm --filter mobile typecheck
pnpm --filter mobile lint
pnpm --filter mobile test
pnpm --filter mobile start
```

## Visual QA Checklist

- Auth login and register screens look intentional and consistent.
- Shopping list overview clearly separates header, primary action, list cards, and archive action.
- List detail screen supports quick scanning of title, status, budget, actions, and item rows.
- Item rows preserve 44px minimum touch targets for check/edit/remove actions.
- Form inputs show labels, invalid states, disabled/submitting states, and safe errors consistently.
- Loading states reserve appropriate space and communicate progress.
- Empty states explain the situation and provide the best next action where applicable.
- Error states provide safe messages and retry actions where available.
- Long product/list names and large prices do not overlap controls.
- Existing navigation destinations and flow step counts remain unchanged.

## Rollback Checks

- If a token change affects many screens unexpectedly, revert the token/theme commit first.
- If one screen group regresses, revert only that migration slice.
- If a shared component becomes too broad or feature-specific, keep the screen migration paused and simplify the component API before continuing.

## Future Dark Mode Notes

- Do not hardcode light colors in screens.
- Preserve semantic token names.
- Keep theme mappings separate from component behavior.
- Avoid screen-level conditional theme logic.
- Add dark mode later by mapping the same semantic roles to dark values.
