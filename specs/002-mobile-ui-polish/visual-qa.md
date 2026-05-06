# Visual QA: Mobile UI Polish

## How to Use This Checklist

Run through this checklist manually in Expo after completing each phase. Mark items as `[x]` when passing and `[!]` with a note when there is a deviation. Deviations that are not blocking should be noted under "Known Deviations" at the bottom.

Validation commands to run before each manual review:

```bash
pnpm --filter mobile typecheck
pnpm --filter mobile lint
pnpm --filter mobile test
pnpm --filter mobile start
```

---

## Baseline (Before Any Changes)

Captured state before migration begins. Use this section to compare against after-state.

### Auth screens

- [ ] Login screen: app title and subtitle are visible above the form
- [ ] Login screen: email and password fields have visible labels
- [ ] Login screen: invalid credentials produce a visible error message below the form
- [ ] Login screen: "Criar Conta" link is tappable and routes to register
- [ ] Register screen: all three fields (email, senha, confirmar senha) are visible with labels
- [ ] Register screen: password mismatch produces a field-level error
- [ ] Register screen: successful register shows confirmation text before routing

### List overview

- [ ] Screen renders without crashing when the list is empty
- [ ] "Crie sua primeira lista mensal." is shown when no lists exist
- [ ] A loading state is shown before lists arrive (AsyncState spinner)
- [ ] "Nova" button is tappable and routes to the new-list screen
- [ ] Each list card shows name, budget, and status
- [ ] Completed lists show an "Arquivar" button
- [ ] Archive confirmation alert appears before archiving

### List detail

- [ ] List name and status are visible at the top
- [ ] Budget summary shows Gasto, Restante, and the progress bar
- [ ] Over-budget alert is visible when total exceeds budget
- [ ] "Comparativo", "Completo" (if active), and "Item" buttons are all reachable
- [ ] Items are listed below with name, quantity × price, and total
- [ ] Each item row has a check toggle, edit button, and remove button
- [ ] "Lista vazia" message appears when no items exist
- [ ] Tapping edit on an item routes to the item edit screen

### Forms

- [ ] New list form: name and budget fields have labels
- [ ] New list form: empty name produces a validation error
- [ ] New list form: invalid budget produces a validation error
- [ ] New item form: product picker allows selecting an existing product
- [ ] New item form: quantity and unit price fields have labels
- [ ] New item form: submitting without required fields produces errors
- [ ] New product form: name field is required; brand/barcode/unit are optional
- [ ] Duplicate product notice appears when name/brand closely match an existing product

### Loading, empty, and error states

- [ ] Network errors in list overview show an error message and "Tentar novamente" button
- [ ] Network errors in list detail show an error message and "Tentar novamente" button
- [ ] Loading spinner is shown while data is being fetched
- [ ] Empty state messages are legible and not clipped

### Small-viewport checks (320px wide or compact iPhone)

- [ ] Auth form fields are fully visible without horizontal scrolling
- [ ] List overview cards do not clip the name or budget
- [ ] List detail action buttons do not overlap each other
- [ ] Item rows: product name, price, total, and buttons do not overlap
- [ ] Long product names do not push the total price off-screen

### Accessibility baseline

- [ ] Submit buttons have `accessibilityLabel` or readable text
- [ ] Check/remove icon buttons have `accessibilityLabel`
- [ ] Budget summary has `accessibilityRole="summary"` and label
- [ ] Over-budget alert has `accessibilityRole="alert"` and label

---

## After Phase 2: Foundation

Confirm additive changes did not break existing screens.

- [ ] App still launches without error after Tamagui config extension
- [ ] Existing Tamagui token references (`$gray10`, `$red10`, `$green10`, `$blue10`) still resolve
- [x] `pnpm --filter mobile typecheck` — pre-existing TS2688 error (Node 24 vs `@types/node@22`); not introduced by Phase 2
- [x] `pnpm --filter mobile test` — **99 tests, 26 files, all passed** (3 new shared/ui boundary tests added via T022)
- [ ] No visible regression on any screen

### T023 Checkpoint — 2026-05-06

| Command | Result |
|---------|--------|
| `pnpm --filter mobile test` | ✅ 99/99 passed (26 files) |
| `pnpm --filter mobile typecheck` | ⚠️ Pre-existing TS2688 (`Cannot find type definition file for 'node'`) — Node 24 / `@types/node` mismatch, not related to Phase 2 |
| Expo smoke start | Pending — requires Supabase `.env` and physical device/simulator |

**Files created in Phase 2:**

- `src/shared/design-system/tokens.ts` — colors, spacing, radius, shadows, typography
- `src/shared/design-system/themes.ts` — light theme + Tamagui extension object
- `src/shared/design-system/variants.ts` — button, input, card, list-item, state variants
- `src/shared/design-system/index.ts` — barrel
- `tamagui.config.ts` — extended with `tamaguiThemeExtension` (app-prefixed keys only)
- `src/shared/ui/ScreenContainer.tsx`
- `src/shared/ui/SectionHeader.tsx`
- `src/shared/ui/AppButton.tsx`
- `src/shared/ui/FloatingActionButton.tsx`
- `src/shared/ui/AppInput.tsx`
- `src/shared/ui/AppCard.tsx`
- `src/shared/ui/AppListItem.tsx`
- `src/shared/ui/LoadingState.tsx`
- `src/shared/ui/EmptyState.tsx`
- `src/shared/ui/ErrorState.tsx`
- `src/shared/ui/StatusState.tsx` (+ `SuccessState`, `WarningState`, `InfoState`, `ConfirmationText`)
- `src/shared/ui/InvalidFieldText.tsx`
- `src/shared/ui/index.ts` — barrel

---

## After Phase 3 (US1): Visual Hierarchy

### Auth screens

- [ ] Login and register have consistent background and screen padding
- [ ] App title has visually stronger weight than the subtitle
- [ ] Submit buttons are visually primary (filled, prominent)
- [ ] Nav links ("Criar Conta", "Faça login") are visually secondary (less prominent than submit)
- [ ] Field labels are above their inputs
- [ ] Field errors are associated with the correct field and readable

### List overview

- [ ] Screen title ("Listas") is the most prominent text element
- [ ] "Nova" button is clearly a primary action
- [ ] List cards have a distinct card surface (not a plain border box)
- [ ] List name is more prominent than status + budget metadata
- [ ] "Arquivar" button is visually secondary to the list card
- [ ] On a list with 6+ items, cards are scrollable without layout issues

### List detail

- [ ] List name and status are clearly the primary content at the top
- [ ] Action buttons (Comparativo, Completo, Item) do not overflow on small screens
- [ ] Budget card surface is visually distinct from the screen background
- [ ] Progress bar reflects the correct color for over-budget vs. within-budget
- [ ] Over-budget alert is visually distinct and uses semantic danger color (no raw hex)
- [ ] Item rows are easy to scan; product name is the most prominent text
- [ ] Check, edit, remove touch targets are at least 44px

### Forms

- [ ] Field labels are consistently above their inputs across all forms
- [ ] Submit buttons show a loading indicator while pending (not just disabled)
- [ ] Submit buttons are disabled while pending
- [ ] Field errors appear directly below the relevant input
- [ ] Form-level errors (auth, mutations) are visually distinct from field errors

### Navigation and behavior

- [ ] All route destinations are unchanged from baseline
- [ ] Step count to complete a list creation, add an item, and check it off is unchanged
- [ ] No new navigation steps were introduced

---

## After Phase 4 (US2): Visual States

### Loading states

- [ ] Loading has a spinner and label on all screens
- [ ] Loading reserves consistent vertical space (does not collapse the layout)

### Empty states

- [ ] List overview empty: explains situation and labels the create action
- [ ] List detail empty: explains situation and points to the add item action
- [ ] Insights empty: explains situation clearly

### Error states

- [ ] Error shows a safe message (no stack traces, tokens, or raw credentials)
- [ ] Error provides a "Tentar novamente" button where a retry is possible
- [ ] Error state has a visual container with appropriate tone (not plain text)

### Form states

- [ ] Invalid fields highlight the input border or show error styling on the field itself
- [ ] `InvalidFieldText` is visually consistent across all 5 forms
- [ ] Pending submit shows a loading indicator on the button
- [ ] Disabled fields (when applicable) are visually distinct from enabled

### Warnings and success

- [ ] Post-register success message uses a consistent success tone (not plain `Text color="$green10"`)
- [ ] OverBudgetAlert uses danger tokens (no raw hex background/border colors)
- [ ] PriceComparisonIndicator uses semantic tones, not raw hex border

---

## After Phase 5 (US3): Reusable Foundation

- [ ] A hypothetical new screen can be built using only imports from `@/shared/ui` and `@/shared/design-system`
- [ ] No migrated screen repeats the same card/list/form inline style locally
- [ ] Design-system README documents how to use tokens, variants, and shared components

---

## Final Validation

- [ ] `pnpm --filter mobile typecheck` passes with zero errors
- [ ] `pnpm --filter mobile lint` passes with zero errors or only pre-existing warnings
- [ ] `pnpm --filter mobile test` all tests pass
- [ ] Visual QA baseline items all pass (re-check after migration)
- [ ] No raw hex colors remain in migrated files (check with `rg "#[0-9a-fA-F]{3,6}" apps/mobile/src/app apps/mobile/src/features`)
- [ ] No repeated `style={{ borderRadius: 8, borderWidth: 1 }}` patterns in migrated files
- [ ] Accessibility labels are present on all interactive icon-only buttons

---

## Known Deviations

_Record any items that did not pass but are accepted as follow-up or known limitations._

| Item | Status | Note |
|------|--------|------|
| | | |
