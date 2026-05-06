# Visual Audit: Mobile UI Polish

## Screens Inventoried

### Auth: Login — `apps/mobile/src/app/(auth)/login.tsx`

**Current issues**

- Hard-coded `style={{ flex: 1, justifyContent: "center", padding: 20 }}` on root `YStack`.
- No shared screen container; padding and centering duplicated with register.
- App title rendered as plain `Text fontSize="$9"` with no semantic screen-title role.
- "ShopPilot" branding and subtitle have no visual separation from the form area.
- Navigation link ("Criar Conta") uses a raw `Button chromeless` with no visual hierarchy distinction from the primary login action.
- Missing: no visible loading feedback on the nav link while login mutation is pending.

**Candidate shared components**

- `ScreenContainer` for padding/background/centering.
- `AppButton` with `primary` and `subtle` variants to distinguish login action from nav link.
- Typography token for display/screen-title role.

---

### Auth: Register — `apps/mobile/src/app/(auth)/register.tsx`

**Current issues**

- Identical `style={{ flex: 1, justifyContent: "center", padding: 20 }}` duplication with login.
- Success message rendered as `Text color="$green10"` inline with no semantic success state.
- Nav link and submit button visually identical in type (both `Button` or `Button chromeless`).

**Candidate shared components**

- `ScreenContainer` (same as login).
- `StatusState` or `SuccessState` for the post-register confirmation message.
- `AppButton` for submit vs. nav link hierarchy.

---

### Auth: LoginForm — `apps/mobile/src/features/auth/LoginForm.tsx`

**Current issues**

- Field errors: `Text color="$red10"` — no semantic error component, duplicated in every form.
- Submit error: also `Text color="$red10"` — visually identical to field errors, no distinction.
- Raw Tamagui `Input` + `Label` with no shared wrapper enforcing consistent spacing.
- No loading indicator on the submit button during `isSubmitting`.

**Candidate shared components**

- `AppInput` (Label + Input + error text as one unit).
- `InvalidFieldText` for field-level errors.
- `AppButton` with `loading` / `disabled` visual state.

---

### Auth: RegisterForm — `apps/mobile/src/features/auth/RegisterForm.tsx`

**Current issues**

- Same `Text color="$red10"` pattern for field and form-level errors.
- Iterates over field names with no difference in error rendering between fields.
- Raw `Input` without shared wrapper.

**Candidate shared components**

- `AppInput`, `InvalidFieldText`, `AppButton` (same as LoginForm).

---

### List Overview — `apps/mobile/src/app/(app)/index.tsx`

**Current issues**

- Root `ScrollView flex={1}` + inner `YStack gap="$4" style={{ padding: 16 }}` — repeated padding pattern.
- Header `XStack style={{ alignItems: "center", justifyContent: "space-between" }}` is hand-rolled; no shared section header.
- Screen title `Text fontSize="$8" fontWeight="700"` is duplicated across list overview, new-item, new-product, and insights screens.
- "Nova" button is a default-styled Tamagui `Button` with no primary variant.
- Archive button: `style={{ alignSelf: "flex-end" }}` inline, size `$3` raw — no shared secondary action variant.

**Candidate shared components**

- `ScreenContainer` for scroll + padding.
- `SectionHeader` for title + trailing action.
- `AppButton` with `primary` / `secondary` / `danger` variants.

---

### ShoppingListCard — `apps/mobile/src/features/shopping-list/ShoppingListCard.tsx`

**Current issues**

- Uses `Button chromeless` + `style={{ justifyContent: "flex-start", padding: 0 }}` to simulate a card — not a semantic card surface.
- Card border: `borderRadius: 8, borderWidth: 1` inline — no shared token.
- Card padding: `padding: 16` inline.
- Status + budget on one `Text color="$gray10"` line — no visual weight hierarchy between name and metadata.

**Candidate shared components**

- `AppCard` with `actionable` variant.
- `AppListItem` for name/subtitle/trailing chevron layout.

---

### List Detail — `apps/mobile/src/app/(app)/lists/[listId].tsx`

**Current issues**

- `XStack style={{ justifyContent: "space-between", flex: 1, flexDirection: "column", gap: 16 }}` — `XStack` used with column direction (semantically wrong, should be `YStack`).
- Hard-coded `gap: 16` in style object instead of Tamagui `$4` token.
- Actions area: `XStack gap="$2"` with three buttons (Comparativo, Completo, Item) crams horizontally with no wrapping on small screens.
- `YStack gap="$4" style={{ padding: 16 }}` repeated from overview.
- Screen title `Text fontSize="$8" fontWeight="700"` duplicated again.

**Missing states**

- No explicit empty state treatment beyond delegating to `AsyncState emptyMessage="Lista vazia"`.

**Candidate shared components**

- `ScreenContainer`, `SectionHeader`, `AppButton`.
- Responsive wrapping for action row (consider `flexWrap: "wrap"`).

---

### BudgetSummary — `apps/mobile/src/features/shopping-list/BudgetSummary.tsx`

**Current issues**

- `borderRadius: 8, borderWidth: 1, padding: 16` inline — identical to ShoppingListCard card pattern.
- Hard-coded raw hex colors in `Progress.Indicator`: `"#dc2626"` (red) and `"#16a34a"` (green) — bypasses theme entirely.
- No semantic card surface.

**Candidate shared components**

- `AppCard` for the outer container.
- Danger/success color tokens for the progress bar tones.

---

### OverBudgetAlert — `apps/mobile/src/features/shopping-list/OverBudgetAlert.tsx`

**Current issues**

- All styling is raw hex: `backgroundColor: "#fee2e2"`, `borderColor: "#fca5a5"`, `borderRadius: 8`, `borderWidth: 1`, `padding: 12`.
- These are pure theme values that will break dark mode immediately.

**Candidate shared components**

- `StatusState` / `AppCard` with `danger` tone.
- Danger background/border tokens.

---

### ShoppingListItemRow — `apps/mobile/src/features/shopping-list-items/ShoppingListItemRow.tsx`

**Current issues**

- `borderBottomWidth: 1, paddingVertical: 12` inline — no semantic separator token.
- Check/remove icon buttons each repeat `style={{ minHeight: 44, minWidth: 44 }}` inline.
- Edit button uses `style={{ flex: 1, justifyContent: "flex-start", minHeight: 44, padding: 0 }}` hack.
- Bought state rendered through `fontWeight`/`textDecorationLine` inline props — no `completed` variant.

**Candidate shared components**

- `AppListItem` with `completed` variant.
- `AppButton` icon-only with enforced 44px target.

---

### ShoppingListItemForm — `apps/mobile/src/features/shopping-list-items/ShoppingListItemForm.tsx`

**Current issues**

- `Text color="$red10"` for every field error (4 fields + submit).
- Raw `Input` + `Label` for every field (4× duplication of the same YStack gap pattern).
- `Button disabled={isSubmitting}` with no loading indicator.
- No visual distinction between "add product inline" path vs. "select product" path.

**Candidate shared components**

- `AppInput`, `InvalidFieldText`, `AppButton`.

---

### ShoppingListForm — `apps/mobile/src/features/shopping-list/ShoppingListForm.tsx`

**Current issues**

- Same `Text color="$red10"` for field and form-level errors.
- Raw `Input` + `Label` per field.
- `Button disabled={isSubmitting}` without loading state.

---

### ProductForm — `apps/mobile/src/features/products/ProductForm.tsx`

**Current issues**

- Same pattern: `Text color="$red10"`, raw `Input`/`Label`, no submit loading state.
- Optional fields (brand, barcode, unit) have no visual grouping or optional hint.

---

### New Product Screen — `apps/mobile/src/app/(app)/products/new.tsx`

**Current issues**

- `YStack gap="$4" style={{ padding: 16 }}` repeated.
- Screen title `Text fontSize="$8" fontWeight="700"` duplicated.
- No `Stack.Screen` header configuration set — title falls back to default.

---

### New Item Screen — `apps/mobile/src/app/(app)/lists/[listId]/item-new.tsx`

**Current issues**

- `YStack gap="$4" style={{ padding: 16 }}` repeated.
- Screen title `Text fontSize="$8" fontWeight="700"` duplicated.
- "Criar produtos reutilizáveis" button in an `XStack` with no alignment intent — feels floating.

---

### Insights Screen — `apps/mobile/src/app/(app)/lists/[listId]/insights.tsx`

**Current issues**

- `YStack gap="$4" style={{ padding: 16 }}` repeated.
- Screen title `Text fontSize="$8" fontWeight="700"` duplicated.
- `Stack.Screen` element has extra blank line and inconsistent indentation.

---

### PriceComparisonIndicator — `apps/mobile/src/features/insights/PriceComparisonIndicator.tsx`

**Current issues**

- Hard-coded `borderColor: "#e5e7eb"`, `borderRadius: 6`, `borderWidth: 1`, `padding: 12` — raw values.
- Status color mapping in `statusColor()` uses Tamagui tokens (`$green10`, `$red10`) but border/background are raw hex.

**Candidate shared components**

- `AppCard` with `subtle` variant for the container.

---

### AsyncState — `apps/mobile/src/shared/feedback/AsyncState.tsx`

**Current issues**

- Loading: `YStack gap="$3" style={{ alignItems: "center", padding: 20 }}` + `Spinner` + `Text` — inline, no shared component.
- Error: `YStack gap="$3" style={{ padding: 20 }}` + `Text color="$red10"` + optional retry `Button` — inline.
- Empty: `YStack style={{ padding: 20 }}` + `Text` — inline.
- No consistent visual weight/iconography for states.

**Candidate shared components**

- `LoadingState`, `EmptyState`, `ErrorState` — AsyncState should delegate to these.

---

## Repeated Inline Styles Summary

| Pattern | Occurrences | Candidate |
|---------|-------------|-----------|
| `style={{ padding: 16 }}` on screen root | 5 routes | `ScreenContainer` |
| `Text fontSize="$8" fontWeight="700"` for screen title | 5 routes | Typography token / `SectionHeader` |
| `Text color="$red10"` for field/form errors | 5 forms | `InvalidFieldText` |
| `borderRadius: 8, borderWidth: 1, padding: 16` on `YStack` | 3 components | `AppCard` |
| Raw hex colors (`#dc2626`, `#16a34a`, `#fee2e2`, `#fca5a5`, `#e5e7eb`) | 4 components | Color tokens |
| `Button disabled={isSubmitting}` with no loading state | 5 forms | `AppButton` loading variant |
| `style={{ minHeight: 44, minWidth: 44 }}` on icon buttons | 2 components | `AppButton` icon-only |
| `AsyncState` inline loading/empty/error rendering | 1 component | `LoadingState`, `EmptyState`, `ErrorState` |

---

## Missing States Inventory

| Screen / Component | Loading | Empty | Error | Pending submit | Disabled | Success |
|--------------------|---------|-------|-------|----------------|----------|---------|
| Login | — | — | Yes (text only) | Yes (disabled only) | Partial | — |
| Register | — | — | Yes (text only) | Yes (disabled only) | Partial | Text only |
| List overview | Via AsyncState | Via AsyncState | Via AsyncState | — | — | — |
| List detail | Via AsyncState | Via AsyncState | Via AsyncState | — | — | — |
| BudgetSummary | — | — | — | — | — | — |
| OverBudgetAlert | — | — | — | — | — | — |
| ShoppingListItemRow | — | — | — | — | — | — |
| Item form | — | — | Text only | disabled only | Partial | — |
| Product form | — | — | Text only | disabled only | Partial | — |
| Insights screen | Via AsyncState | Via AsyncState | Via AsyncState | — | — | — |
| PriceComparisonIndicator | — | — | — | — | — | — |

---

## Migration Order

Based on dependency flow and visual impact:

1. **Foundation** — tokens, themes, variants, Tamagui config, shared component barrels (Phase 2 prerequisite, no screen changes)
2. **Auth screens** — lowest risk, isolated from business logic, most visible first impression (T026–T028)
3. **List overview + ShoppingListCard** — high-traffic screen, additive card/header migration (T029–T032)
4. **List detail + BudgetSummary + OverBudgetAlert + ItemRow** — core shopping experience, highest visual density (T033–T035)
5. **Item and list forms** — form field standardization across shared components (T036)
6. **AsyncState refactor** — shared visual states adopted after screen migrations validate component APIs (T040)
7. **Products + insights** — lower frequency, validates reuse (T044)
8. **Cleanup** — remove duplicate inline styles after all migrations settle (T048)

---

## Tamagui Config Review (T004)

### Current state

`apps/mobile/tamagui.config.ts`:

```ts
import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

const tamaguiConfig = createTamagui(defaultConfig);
```

The app uses `defaultConfig` from `@tamagui/config/v5` without any extension. All spacing, radius, color, and font tokens are Tamagui defaults.

### Planned extension path

- Import `defaultConfig` (keep it as the base — do not replace it).
- Merge app-specific tokens: extend `tokens.color`, `tokens.radius`, `tokens.space`.
- Add app themes: extend `themes` with a `light` mapping using semantic role names.
- Pass `fonts` from `defaultConfig.fonts` unchanged unless the font family is replaced later.
- The module augmentation (`TamaguiCustomConfig`) stays as-is — it picks up the new config shape automatically.

### Compatibility constraints

- `@tamagui/config/v5` `defaultConfig` includes fonts. Do not drop it from the merged config.
- Expo and React Native reanimated require Tamagui config to be stable at startup — avoid runtime config mutation.
- Custom tokens must not shadow default token names that are already in use across existing screens (`$gray10`, `$red10`, `$green10`, `$blue10`) unless those usages are migrated first.

### What will NOT change in tamagui.config.ts

- The import of `defaultConfig`.
- The `createTamagui` call signature.
- The `declare module "tamagui"` augmentation block.
- Fonts (unless explicitly scoped to Phase 2 typography work).
