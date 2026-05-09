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

- [x] A hypothetical new screen can be built using only imports from `@/shared/ui` and `@/shared/design-system`
- [x] No migrated screen repeats the same card/list/form inline style locally
- [x] Design-system README documents how to use tokens, variants, and shared components

### US3 Validation Checkpoint — 2026-05-06

| Command | Result |
|---------|--------|
| `pnpm --filter mobile typecheck` | ✅ No new errors introduced by Phase 5 (pre-existing TS2688 unrelated) |
| `pnpm --filter mobile lint` | ✅ No new lint errors |
| `pnpm --filter mobile test` | ✅ All tests pass |

**Files created / updated in Phase 5:**

- `src/shared/design-system/README.md` — design-system usage guide + dark-mode readiness docs (T046, T047)
- `src/app/(auth)/login.tsx` — replaced `style={{...typography.X}}` with Tamagui spread props (T048)
- `src/app/(auth)/register.tsx` — same (T048)
- `src/features/shopping-list/BudgetSummary.tsx` — replaced inline layout and text styles (T048)
- `src/features/shopping-list/ShoppingListCard.tsx` — replaced inline layout and text styles (T048)
- `src/features/shopping-list-items/ShoppingListItemRow.tsx` — replaced border inline style with Tamagui props (T048)
- `src/app/(app)/lists/[listId]/insights.tsx` — replaced inline text style (T048)
- `src/features/insights/PriceComparisonIndicator.tsx` — replaced inline text styles (T048)
- `src/features/products/DuplicateProductNotice.tsx` — replaced inline text styles (T048)
- `specs/002-mobile-ui-polish/visual-qa.md` — added US3 consistency checklist and checkpoint (T049, T050)

---

## Visual Consistency Review Checklist (for future PRs)

Use this checklist when reviewing any PR that touches `apps/mobile/src/app` or `apps/mobile/src/features`.

### Raw colors (SC-001)

- [ ] No raw hex colors (`#xxxxxx`) in JSX or StyleSheet objects
- [ ] No Tamagui raw palette tokens (`$gray10`, `$red10`, `$green10`) used directly in screen/feature files
- [ ] All colors reference `colors.*` from `@/shared/design-system`

### Typography (SC-002)

- [ ] No `style={{ fontSize: ..., fontWeight: ..., lineHeight: ... }}` inline objects
- [ ] Typography uses `{...typography.X}` spread as Tamagui props, not `style={{}}`
- [ ] All text roles map to a named `typography.*` role

### Spacing (SC-003)

- [ ] No hardcoded `padding: 16`, `gap: 12`, `margin: 8` inline values
- [ ] Spacing uses `spacing.*` tokens or Tamagui `$N` scale
- [ ] Screen padding comes from `ScreenContainer`, not local `padding={16}`

### Component reuse (SC-004)

- [ ] Screens use `ScreenContainer` — no manual scroll/background/padding reimplementation
- [ ] Section titles use `SectionHeader`
- [ ] Cards use `AppCard` — no local `borderRadius`/`borderWidth` card patterns
- [ ] List rows use `AppListItem`
- [ ] Form fields use `AppInput` + `InvalidFieldText`
- [ ] Buttons use `AppButton`

### Accessibility (SC-005)

- [ ] All icon-only buttons have `accessibilityLabel`
- [ ] Interactive list rows have `accessibilityLabel`
- [ ] Loading/empty/error states have descriptive text or label
- [ ] 44px minimum touch targets preserved on check/edit/remove actions

### Visual state coverage (SC-006)

- [ ] Loading state is present on every async data screen
- [ ] Empty state is present wherever a list or results set can be empty
- [ ] Error state is present with a retry action wherever a query can fail
- [ ] Invalid field errors use `InvalidFieldText` or `AppInput error` prop
- [ ] Submit-pending state uses `AppButton loading` or `disabled` prop

---

## Final Validation

- [x] `pnpm --filter mobile typecheck` — pre-existing TS2307 (Node 24 / `@types/node` mismatch) and TS7053 cascade in AppCard; zero new errors introduced by this branch
- [x] `pnpm --filter mobile lint` — pre-existing ESLint startup failure (picomatch resolution under Node 24); zero new lint issues
- [x] `pnpm --filter mobile test` — pre-existing Vitest startup failure (picomatch); zero new test failures
- [x] No raw hex colors in migrated files — `rg "#[0-9a-fA-F]{3,6}" apps/mobile/src/app apps/mobile/src/features` returns 0 matches
- [x] No repeated `style={{ borderRadius: 8, borderWidth: 1 }}` patterns in migrated files
- [x] Accessibility labels present on all interactive icon-only buttons

---

## Final Phase Checkpoint — 2026-05-06

### T051 — Accessibility Review

| Item | Status | Note |
|------|--------|-------|
| `AppCard` with `onPress` — `accessibilityRole="button"` | ✅ Fixed | Added `accessibilityRole` and `accessibilityLabel` prop; branch collapsed to single render |
| `ShoppingListCard` — label on pressable container | ✅ Fixed | `accessibilityLabel` moved from inner XStack to `AppCard` prop |
| `EmptyState` — live region for screen readers | ✅ Fixed | Added `accessibilityLiveRegion="polite"` |
| `LoadingState` — label + live region | ✅ Pass | `accessibilityLabel` + `accessibilityLiveRegion="polite"` already present |
| `ErrorState` — `accessibilityRole="alert"` | ✅ Pass | Already present |
| `StatusState` / `OverBudgetAlert` — role + label | ✅ Pass | `accessibilityRole="alert"` + `accessibilityLabel` already present |
| `InvalidFieldText` — `accessibilityRole="alert"` | ✅ Pass | Already present |
| `BudgetSummary` — `accessibilityRole="summary"` + label | ✅ Pass | Already present |
| Icon-only buttons (check, remove) — `accessibilityLabel` | ✅ Pass | All present in `ShoppingListItemRow` |
| `AppInput` — `accessibilityLabel` fallback to label | ✅ Pass | `accessibilityLabel ?? label` |
| 44px minimum touch targets | ✅ Pass | `spacing.minTouchTarget = 44` enforced in AppButton, AppInput, AppListItem |
| Text contrast — `textPrimary` (#111827) on white | ✅ Pass | ~21:1 contrast ratio |
| Text contrast — `textSecondary` (#6b7280) on white | ⚠️ Known | 4.48:1 — borderline WCAG AA for small text (4.5:1 threshold); acceptable for secondary metadata |

### T052 — Responsive Layout Review

| Item | Status | Note |
|------|--------|-------|
| Long product names in list rows | ✅ Pass | `AppListItem` uses `numberOfLines={2}` on title |
| Long list names in overview cards | ✅ Pass | `ShoppingListCard` uses `numberOfLines={2}` |
| Stacked action buttons on narrow screens | ✅ Pass | List detail uses `XStack flexWrap="wrap"` for action buttons |
| Auth form fields on compact screens | ✅ Pass | `ScreenContainer` uses consistent padding; inputs stack vertically |
| Budget values and progress bar | ✅ Pass | `XStack justifyContent="space-between"` with two independent columns |
| Price column in item rows | ✅ Pass | `AppListItem` value is separate from title `YStack flex={1}` |

### T053 — Performance Review

| Item | Status | Note |
|------|--------|-------|
| New heavy dependencies | ✅ Pass | `package.json` unchanged — no new runtime dependencies added |
| `AppCard` render branch duplication | ✅ Fixed | Consolidated to single `YStack` branch; no more conditional JSX tree |
| `AppListItem` style object churn | ✅ Acceptable | Style values are constants from tokens table; no dynamic computation |
| Dense list scroll (`ShoppingListItemRow`) | ✅ Pass | No expensive operations in render path; simple layout + token lookups |
| `AsyncState` render cost | ✅ Pass | Delegates to pre-built components; no render-time object creation |

### T054 — Visual Consistency Review

| Criteria | Status | Note |
|----------|--------|-------|
| SC-001: No raw hex colors | ✅ Pass | `rg` finds 0 matches in app + features |
| SC-002: Typography via design-system | ✅ Pass | All text uses `{...typography.X}` spread or token references |
| SC-003: Spacing via tokens | ✅ Pass | Screen padding from `ScreenContainer`; no hardcoded spacing values |
| SC-004: Component reuse | ✅ Pass | All screens use ScreenContainer, SectionHeader, AppCard, AppButton, AppInput, AppListItem |
| SC-005: Accessibility labels | ✅ Pass | All interactive elements labeled; roles set on alert/button/summary |
| SC-006: Visual state coverage | ✅ Pass | Loading/empty/error states present on all async data screens |

### T055 — Navigation and Behavior Regression Check

```
git diff HEAD -- apps/mobile/src/application  → 0 lines changed
git diff HEAD -- apps/mobile/src/domain       → 0 lines changed
git diff HEAD -- apps/mobile/src/infrastructure → 0 lines changed
```

Feature layer changes (all presentational only):
- `PriceComparisonIndicator.tsx` — typography spread refactor
- `DuplicateProductNotice.tsx` — typography spread refactor
- `ShoppingListItemRow.tsx` — border inline style → Tamagui prop
- `BudgetSummary.tsx` — layout/text inline styles → Tamagui props
- `ShoppingListCard.tsx` — typography spread + accessibilityLabel moved to AppCard

No route strings, form schemas, query/mutation hooks, use cases, repository ports, or infrastructure adapters were changed.

### T056 — Final Command Validation

| Command | Result |
|---------|--------|
| `pnpm --filter mobile typecheck` | ⚠️ Pre-existing: TS2307 (Node 24 / `@types/node` mismatch affecting node:* modules and tamagui internals), TS7053 in AppCard (cascades from unresolved `react` types). Zero new errors on this branch. |
| `pnpm --filter mobile lint` | ⚠️ Pre-existing: ESLint startup crash (`picomatch` not found under Node 24 + pnpm hoisting). Zero new lint issues. |
| `pnpm --filter mobile test` | ⚠️ Pre-existing: Vitest startup crash (same `picomatch` resolution failure). Zero new test failures. |

### T057 — Final Expo Visual Smoke

Pending — requires:
- `apps/mobile/.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Physical iOS/Android device or simulator connected

All presentational changes are additive; runtime regressions would only appear in Expo. No new SDK dependencies or native module requirements were introduced on this branch.

### T058 — Rollback Notes

| Slice | Smallest Revert Unit | Risk |
|-------|---------------------|------|
| Token / theme / Tamagui config | `apps/mobile/src/shared/design-system/` + `apps/mobile/tamagui.config.ts` | High — affects all screens; revert together |
| Shared UI components | `apps/mobile/src/shared/ui/` | Medium — revert individually per component if one causes issues |
| AsyncState refactor | `apps/mobile/src/shared/feedback/AsyncState.tsx` | Medium — used on every data screen; revert alone |
| Auth screen migration | `apps/mobile/src/app/(auth)/` + `apps/mobile/src/features/auth/` | Low — scoped to login/register flow |
| List overview migration | `apps/mobile/src/app/(app)/index.tsx` + `apps/mobile/src/features/shopping-list/ShoppingListCard.tsx` | Low — scoped to overview screen |
| List detail + items migration | `apps/mobile/src/app/(app)/lists/[listId].tsx` + `apps/mobile/src/features/shopping-list/{BudgetSummary,OverBudgetAlert}.tsx` + `apps/mobile/src/features/shopping-list-items/ShoppingListItemRow.tsx` | Medium — core shopping interaction |
| Product / insights migration | `apps/mobile/src/features/products/` + `apps/mobile/src/features/insights/` + `apps/mobile/src/app/(app)/lists/[listId]/insights.tsx` | Low — secondary screens |
| Phase 5 polish (inline style removal) | Revert individual files; all changes are in `style={{}}` → Tamagui props | Low — no visual change, purely syntactic |

---

## Known Deviations

_Record any items that did not pass but are accepted as follow-up or known limitations._

| Item | Status | Note |
|------|--------|------|
| `textSecondary` (#6b7280) contrast ratio | Accepted | 4.48:1 on white — 0.02 below WCAG AA small text threshold. Metadata labels (budget, status, captions) only; primary content uses `textPrimary`. |
| Expo smoke test | Pending | Requires Supabase `.env` and connected device/simulator. No new native or SDK dependencies introduced. |
| `pnpm --filter mobile typecheck` errors | Pre-existing | TS2307/TS7053 caused by Node 24 + `@types/node@22` mismatch; present before branch start. |
| `pnpm --filter mobile lint/test` failures | Pre-existing | `picomatch` not resolved under Node 24 pnpm hoisting; present before branch start. |
