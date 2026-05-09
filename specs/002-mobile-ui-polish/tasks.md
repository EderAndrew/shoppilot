# Tasks: Mobile UI Polish

**Input**: Design documents from `specs/002-mobile-ui-polish/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: This is a UI-only feature, but targeted component tests, route/render smoke tests, and visual QA tasks are included because the user requested quality, visual validation, accessibility, responsiveness, and performance review.

**Organization**: Tasks are grouped by setup, shared foundation, and user stories so each increment can be reviewed and rolled back safely.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after dependencies are met because it touches different files.
- **[Story]**: Maps to user stories from [spec.md](./spec.md): US1 visual hierarchy, US2 visual states, US3 reusable foundation.
- Every task line includes title, objective, technical description, affected paths, dependencies, done criteria, risk, and validation.

## Phase 1: Setup and Visual Audit

**Purpose**: Establish a baseline before changing UI so implementation stays incremental and rollback-friendly.

- [x] T001 Visual audit inventory | Objective: identify current wireframe-like areas | Technical: document all existing route screens, repeated inline styles, missing states, and migration order | Files: `specs/002-mobile-ui-polish/visual-audit.md`, `apps/mobile/src/app/(auth)/login.tsx`, `apps/mobile/src/app/(auth)/register.tsx`, `apps/mobile/src/app/(app)/index.tsx`, `apps/mobile/src/app/(app)/lists/[listId].tsx` | Depends: none | Done: every primary screen has current issues and candidate shared components listed | Risk: low documentation-only | Validation: compare against `rg --files apps/mobile/src/app apps/mobile/src/features`
- [x] T002 [P] Baseline visual QA checklist | Objective: make visual rollback easy | Technical: create before/after checklist covering auth, list overview, list detail, product, forms, loading, empty, and error states | Files: `specs/002-mobile-ui-polish/visual-qa.md`, `specs/002-mobile-ui-polish/quickstart.md` | Depends: none | Done: checklist includes small and regular mobile viewport checks | Risk: low documentation-only | Validation: checklist maps to quickstart visual QA items
- [x] T003 [P] Create design-system folders | Objective: prepare additive structure | Technical: create empty module directories and barrel placeholders without changing runtime behavior | Files: `apps/mobile/src/shared/design-system/index.ts`, `apps/mobile/src/shared/ui/index.ts` | Depends: none | Done: imports can target shared design-system and shared ui barrels | Risk: low additive change | Validation: `pnpm --filter mobile typecheck`
- [x] T004 Tamagui config review note | Objective: avoid accidental global breakage | Technical: document current `defaultConfig` usage and exact planned config extension path before editing config | Files: `specs/002-mobile-ui-polish/visual-audit.md`, `apps/mobile/tamagui.config.ts` | Depends: T001 | Done: audit states what will change in `tamagui.config.ts` and what stays compatible | Risk: low documentation-only | Validation: reviewer can trace config plan to `plan.md`

## Phase 2: Foundational Visual System

**Purpose**: Build shared tokens, theme, variants, and base components before migrating screens.

**Critical**: No route screen migration should begin until this phase is complete.

- [x] T005 Color token foundation | Objective: centralize palette | Technical: define semantic light colors for background, surface, elevated surface, text, border, primary teal, secondary amber, success, warning, danger, and disabled roles | Files: `apps/mobile/src/shared/design-system/tokens.ts` | Depends: T003 | Done: no screen imports raw palette values from this file directly except through semantic exports | Risk: medium global visual impact | Validation: `pnpm --filter mobile typecheck`
- [x] T006 Spacing scale foundation | Objective: standardize padding and gaps | Technical: define screen, section, card, form, list, and control spacing constants compatible with Tamagui token usage | Files: `apps/mobile/src/shared/design-system/tokens.ts` | Depends: T005 | Done: spacing scale supports compact list rows and spacious screen containers | Risk: low additive token change | Validation: inspect generated token names for semantic intent
- [x] T007 Radius and shadow foundation | Objective: create soft UI depth | Technical: define radius values for small controls, cards, sheets, pills, plus subtle shadows for elevated surfaces without heavy visual noise | Files: `apps/mobile/src/shared/design-system/tokens.ts` | Depends: T006 | Done: card, input, button, and state container radii are represented | Risk: low additive token change | Validation: typecheck and visual review of token values
- [x] T008 Typography foundation | Objective: improve hierarchy and legibility | Technical: define semantic typography roles for display, screen title, section title, body, body strong, caption, button, and field label | Files: `apps/mobile/src/shared/design-system/tokens.ts` | Depends: T007 | Done: roles cover screen headers, lists, cards, forms, and state messages | Risk: medium if sizes are too large on small screens | Validation: manual small viewport review after first component adoption
- [x] T009 Light theme and dark-ready mapping | Objective: prepare theme layer | Technical: map tokens into a complete light theme with stable semantic names that can be reused by future dark mode | Files: `apps/mobile/src/shared/design-system/themes.ts` | Depends: T005, T006, T007, T008 | Done: theme exposes light roles for background, surface, text, border, interactive, and state tones | Risk: medium global theme impact | Validation: `pnpm --filter mobile typecheck`
- [x] T010 Central variant definitions | Objective: avoid duplicated visual decisions | Technical: define button, input, card, list item, state, section header, screen, and floating action button variants in one module | Files: `apps/mobile/src/shared/design-system/variants.ts` | Depends: T009 | Done: variants cover primary, secondary, subtle, danger, disabled, invalid, completed, compact, and elevated states | Risk: medium because variants drive all components | Validation: review against `contracts/design-system-contract.md`
- [x] T011 Design-system barrel exports | Objective: make usage consistent | Technical: export tokens, themes, variants, and shared types from one entry point | Files: `apps/mobile/src/shared/design-system/index.ts` | Depends: T005, T009, T010 | Done: feature and shared UI modules can import from `@/shared/design-system` | Risk: low additive change | Validation: `pnpm --filter mobile typecheck`
- [x] T012 Tamagui config integration | Objective: connect foundation to runtime | Technical: extend `createTamagui(defaultConfig)` with app tokens/themes while preserving Tamagui and Expo compatibility | Files: `apps/mobile/tamagui.config.ts`, `apps/mobile/src/shared/design-system/themes.ts`, `apps/mobile/src/shared/design-system/tokens.ts` | Depends: T011 | Done: app compiles and existing Tamagui imports still work | Risk: high because config affects all screens | Validation: `pnpm --filter mobile typecheck` and smoke launch with `pnpm --filter mobile start`
- [x] T013 ScreenContainer component | Objective: standardize screen padding and background | Technical: create presentational container using Tamagui layout primitives, safe spacing defaults, scroll/non-scroll modes, and no navigation or data logic | Files: `apps/mobile/src/shared/ui/ScreenContainer.tsx` | Depends: T010 | Done: component supports children, optional scroll, and consistent background/padding | Risk: low additive component | Validation: component render test in T024
- [x] T014 [P] SectionHeader component | Objective: standardize section titles and actions | Technical: create header primitive with title, optional subtitle, optional trailing action slot, and responsive wrapping | Files: `apps/mobile/src/shared/ui/SectionHeader.tsx` | Depends: T010 | Done: long titles/subtitles do not overlap trailing actions | Risk: low additive component | Validation: component render test in T024
- [x] T015 [P] AppButton component | Objective: centralize button hierarchy | Technical: create typed button wrapper with primary, secondary, subtle, danger, icon-only, loading, disabled, and full-width variants | Files: `apps/mobile/src/shared/ui/AppButton.tsx` | Depends: T010 | Done: 44px minimum touch target and accessibility label support are preserved | Risk: medium because buttons drive core actions | Validation: component render test in T024
- [x] T016 [P] FloatingActionButton component | Objective: provide reusable prominent mobile action | Technical: create optional FAB primitive using shared button variants, safe hit target, icon support, and no route coupling | Files: `apps/mobile/src/shared/ui/FloatingActionButton.tsx` | Depends: T015 | Done: component can be used for add actions without changing navigation contracts | Risk: medium because FAB can obscure content if misused | Validation: manual screen review before any adoption
- [x] T017 [P] AppInput component | Objective: centralize form field visuals | Technical: create input wrapper with label, helper text, error text, disabled/submitting states, keyboard props passthrough, and existing React Hook Form compatibility | Files: `apps/mobile/src/shared/ui/AppInput.tsx` | Depends: T010 | Done: field-level errors remain associated with the input and validation rules stay in schemas | Risk: medium because forms are core flows | Validation: component render test in T024
- [x] T018 [P] AppCard component | Objective: standardize surfaces | Technical: create card primitive with default, elevated, subtle, actionable, and warning/danger tone support | Files: `apps/mobile/src/shared/ui/AppCard.tsx` | Depends: T010 | Done: card supports list/card content without nested-card styling | Risk: low additive component | Validation: component render test in T024
- [x] T019 [P] AppListItem component | Objective: standardize list rows | Technical: create row primitive with leading/trailing slots, title, subtitle, value, selected/completed variants, and long text handling | Files: `apps/mobile/src/shared/ui/AppListItem.tsx` | Depends: T010 | Done: row preserves 44px minimum interactive areas and supports quick scanning | Risk: medium because shopping rows are dense | Validation: component render test in T024
- [x] T020 [P] Visual state components | Objective: standardize async feedback | Technical: create EmptyState, LoadingState, ErrorState, SuccessState, WarningState, and InvalidFieldText using safe copy slots and retry/action callbacks | Files: `apps/mobile/src/shared/ui/EmptyState.tsx`, `apps/mobile/src/shared/ui/LoadingState.tsx`, `apps/mobile/src/shared/ui/ErrorState.tsx`, `apps/mobile/src/shared/ui/StatusState.tsx`, `apps/mobile/src/shared/ui/InvalidFieldText.tsx` | Depends: T010 | Done: all states match `contracts/visual-state-contract.md` | Risk: medium because states affect perception of failures | Validation: component render test in T025
- [x] T021 Shared UI barrel exports | Objective: make components easy to reuse | Technical: export all shared UI primitives from a single barrel without circular imports | Files: `apps/mobile/src/shared/ui/index.ts` | Depends: T013, T014, T015, T016, T017, T018, T019, T020 | Done: feature modules can import shared UI from `@/shared/ui` | Risk: low additive change | Validation: `pnpm --filter mobile typecheck`
- [x] T022 Shared UI no-business-rule guard | Objective: protect architecture | Technical: add or extend a test/assertion that shared UI files do not import Supabase, repositories, query hooks, domain services, or route modules | Files: `apps/mobile/tests/security/no-supabase-ui-imports.test.ts`, `apps/mobile/src/shared/ui/index.ts` | Depends: T021 | Done: test covers `apps/mobile/src/shared/ui` and existing UI import boundaries | Risk: low test-only change | Validation: `pnpm --filter mobile test`
- [x] T023 Foundation validation checkpoint | Objective: verify foundation before migration | Technical: run typecheck, lint, tests, and Expo smoke start after tokens, theme, variants, and base components exist | Files: `apps/mobile/tamagui.config.ts`, `apps/mobile/src/shared/design-system/index.ts`, `apps/mobile/src/shared/ui/index.ts` | Depends: T012, T021, T022 | Done: validation results recorded in `specs/002-mobile-ui-polish/visual-qa.md` | Risk: low validation-only | Validation: `pnpm --filter mobile typecheck`, `pnpm --filter mobile lint`, `pnpm --filter mobile test`, `pnpm --filter mobile start`

## Phase 3: User Story 1 - Navigate Existing Shopping Flows With Clearer Visual Hierarchy (Priority: P1) MVP

**Goal**: Existing primary shopping flows feel polished, clear, and easy to scan while behavior, routes, APIs, forms, and business rules remain unchanged.

**Independent Test**: Open existing primary screens and confirm main content, primary actions, secondary actions, and supporting details are visually distinct; existing flow step counts remain unchanged.

### Tests and Validation for User Story 1

- [x] T024 [P] [US1] Shared component render tests | Objective: protect reusable hierarchy primitives | Technical: test ScreenContainer, SectionHeader, AppButton, AppInput, AppCard, and AppListItem render states and long text handling | Files: `apps/mobile/tests/unit/shared/ui-foundation.test.tsx`, `apps/mobile/src/shared/ui/ScreenContainer.tsx`, `apps/mobile/src/shared/ui/AppButton.tsx` | Depends: T021 | Done: tests pass and cover disabled, invalid, long title, and icon-only cases | Risk: low test-only | Validation: `pnpm --filter mobile test`
- [x] T025 [P] [US1] Visual hierarchy route smoke tests | Objective: verify migrated routes still render | Technical: add route/component smoke coverage for auth, list overview, list detail, and form entry points without changing navigation | Files: `apps/mobile/tests/integration/routes-auth-list.test.tsx`, `apps/mobile/src/app/(auth)/login.tsx`, `apps/mobile/src/app/(app)/index.tsx` | Depends: T021 | Done: tests assert key labels/actions remain available | Risk: medium if tests become brittle | Validation: `pnpm --filter mobile test`

### Implementation for User Story 1

- [x] T026 [US1] Migrate auth layout shell | Objective: improve first impression | Technical: apply ScreenContainer and shared typography/card spacing to auth layout without changing route grouping | Files: `apps/mobile/src/app/(auth)/_layout.tsx`, `apps/mobile/src/app/(auth)/login.tsx`, `apps/mobile/src/app/(auth)/register.tsx` | Depends: T023 | Done: auth screens use shared layout and keep existing login/register navigation | Risk: medium visible first-screen change | Validation: manual auth screen review and `pnpm --filter mobile test`
- [x] T027 [US1] Migrate LoginForm visuals | Objective: standardize login form | Technical: replace duplicated Tamagui Input/Button/error styling with AppInput, AppButton, and InvalidFieldText while preserving React Hook Form and Zod schema behavior | Files: `apps/mobile/src/features/auth/LoginForm.tsx`, `apps/mobile/src/shared/ui/AppInput.tsx`, `apps/mobile/src/shared/ui/AppButton.tsx` | Depends: T017, T015, T026 | Done: same submit values and error messages are preserved | Risk: medium form regression | Validation: existing auth tests and manual invalid login state
- [x] T028 [US1] Migrate RegisterForm visuals | Objective: standardize account creation form | Technical: apply AppInput/AppButton/InvalidFieldText to register fields while preserving schema validation and mutation wiring | Files: `apps/mobile/src/features/auth/RegisterForm.tsx`, `apps/mobile/src/shared/ui/AppInput.tsx`, `apps/mobile/src/shared/ui/InvalidFieldText.tsx` | Depends: T017, T015, T026 | Done: field errors and submit disabled/pending behavior remain visible | Risk: medium form regression | Validation: existing auth tests and manual invalid register state
- [x] T029 [US1] Migrate shopping list overview screen | Objective: clarify list overview hierarchy | Technical: apply ScreenContainer, SectionHeader, AppButton, and consistent spacing to overview without changing `router.push` destinations or archive mutation | Files: `apps/mobile/src/app/(app)/index.tsx`, `apps/mobile/src/shared/ui/ScreenContainer.tsx`, `apps/mobile/src/shared/ui/SectionHeader.tsx` | Depends: T023 | Done: title, create action, list content, and archive action are visually distinct | Risk: medium route-level visual change | Validation: `pnpm --filter mobile test` and manual overview review
- [x] T030 [US1] Migrate ShoppingListCard | Objective: make lists scan like polished cards | Technical: replace one-off border/padding styles with AppCard/AppListItem variants and preserve accessibility label and onPress behavior | Files: `apps/mobile/src/features/shopping-list/ShoppingListCard.tsx`, `apps/mobile/src/shared/ui/AppCard.tsx`, `apps/mobile/src/shared/ui/AppListItem.tsx` | Depends: T018, T019, T029 | Done: card shows name, budget, status, chevron, and same press behavior | Risk: medium dense list styling | Validation: manual long list name and budget review
- [x] T031 [US1] Migrate new shopping list screen | Objective: align create-list flow | Technical: apply ScreenContainer/SectionHeader and shared form spacing without altering route or create mutation | Files: `apps/mobile/src/app/(app)/lists/new.tsx`, `apps/mobile/src/features/shopping-list/ShoppingListForm.tsx` | Depends: T027, T029 | Done: create screen uses shared layout and existing submit flow | Risk: medium form visual regression | Validation: create-list integration flow still passes
- [x] T032 [US1] Migrate ShoppingListForm visuals | Objective: standardize list form fields | Technical: replace raw Label/Input/Text/Button styling with AppInput/AppButton while preserving `shoppingListSchema.safeParse` and form errors | Files: `apps/mobile/src/features/shopping-list/ShoppingListForm.tsx`, `apps/mobile/src/shared/ui/AppInput.tsx`, `apps/mobile/src/shared/ui/AppButton.tsx` | Depends: T017, T015 | Done: name and budget validation behave exactly as before | Risk: medium form regression | Validation: manual invalid budget and empty name review
- [x] T033 [US1] Migrate list detail header and actions | Objective: clarify active list screen | Technical: apply ScreenContainer, SectionHeader, AppButton variants, and responsive action wrapping while keeping compare, complete, and add item routes/actions unchanged | Files: `apps/mobile/src/app/(app)/lists/[listId].tsx`, `apps/mobile/src/shared/ui/ScreenContainer.tsx`, `apps/mobile/src/shared/ui/AppButton.tsx` | Depends: T029, T030 | Done: list name/status/actions are readable on small screens | Risk: high dense screen layout | Validation: manual small viewport review and list detail integration tests
- [x] T034 [US1] Migrate BudgetSummary and OverBudgetAlert visuals | Objective: make budget feedback clearer | Technical: apply AppCard/status variants to budget totals and over-budget warning while preserving all calculations and props | Files: `apps/mobile/src/features/shopping-list/BudgetSummary.tsx`, `apps/mobile/src/features/shopping-list/OverBudgetAlert.tsx`, `apps/mobile/src/shared/ui/AppCard.tsx`, `apps/mobile/src/shared/ui/StatusState.tsx` | Depends: T018, T020, T033 | Done: budget values and warning state match existing data exactly | Risk: medium visual interpretation of budget | Validation: existing budget domain tests plus manual over-budget screen
- [x] T035 [US1] Migrate ShoppingListItemRow | Objective: improve item scanning and touch targets | Technical: use AppListItem/AppButton icon variants for check, edit, total, and remove areas while preserving toggle/edit/remove callbacks | Files: `apps/mobile/src/features/shopping-list-items/ShoppingListItemRow.tsx`, `apps/mobile/src/shared/ui/AppListItem.tsx`, `apps/mobile/src/shared/ui/AppButton.tsx` | Depends: T019, T015, T033 | Done: bought/unbought, total price, edit, remove, and 44px touch targets are preserved | Risk: high core shopping interaction | Validation: manual long product names and item integration flow
- [x] T036 [US1] Migrate item form screens and form component | Objective: align add/edit item flows | Technical: apply ScreenContainer, SectionHeader, AppInput, AppButton, and shared spacing to item-new and item-edit screens/forms without changing schemas or mutations | Files: `apps/mobile/src/app/(app)/lists/[listId]/item-new.tsx`, `apps/mobile/src/app/(app)/lists/[listId]/item-[itemId].tsx`, `apps/mobile/src/features/shopping-list-items/ShoppingListItemForm.tsx` | Depends: T017, T015, T033 | Done: add/edit item flows submit the same data and show same validation messages | Risk: high form and route interaction | Validation: monthly shopping MVP integration flow
- [x] T037 [US1] US1 validation checkpoint | Objective: confirm MVP visual hierarchy | Technical: run tests and record before/after notes for auth, list overview, list detail, list item, and item form screens | Files: `specs/002-mobile-ui-polish/visual-qa.md`, `apps/mobile/src/app/(app)/index.tsx`, `apps/mobile/src/app/(app)/lists/[listId].tsx` | Depends: T026, T027, T028, T029, T030, T031, T032, T033, T034, T035, T036 | Done: primary actions identifiable within 3 seconds and flow step counts unchanged | Risk: low validation-only | Validation: `pnpm --filter mobile typecheck`, `pnpm --filter mobile lint`, `pnpm --filter mobile test`

## Phase 4: User Story 2 - Receive Consistent Feedback During Loading, Empty, and Error States (Priority: P2)

**Goal**: Loading, empty, error, success, warning, disabled, and invalid states feel intentional and provide clear recovery paths where appropriate.

**Independent Test**: Force loading, empty, and error states across existing screens and confirm consistent, legible, actionable feedback.

### Tests and Validation for User Story 2

- [x] T038 [P] [US2] Visual state component tests | Objective: lock state contracts | Technical: test LoadingState, EmptyState, ErrorState, StatusState, and InvalidFieldText for labels, retry/action callbacks, and safe message rendering | Files: `apps/mobile/tests/unit/shared/visual-states.test.tsx`, `apps/mobile/src/shared/ui/LoadingState.tsx`, `apps/mobile/src/shared/ui/ErrorState.tsx` | Depends: T020 | Done: tests cover loading, empty action, error retry, warning, success, and invalid field text | Risk: low test-only | Validation: `pnpm --filter mobile test`
- [x] T039 [P] [US2] AsyncState regression tests | Objective: preserve existing async behavior | Technical: test AsyncState delegates to shared state components while preserving children rendering, fallback support, retry callbacks, and safe error messages | Files: `apps/mobile/tests/unit/shared/async-state.test.tsx`, `apps/mobile/src/shared/feedback/AsyncState.tsx` | Depends: T020 | Done: existing AsyncState public props behave the same | Risk: medium shared state wrapper | Validation: `pnpm --filter mobile test`

### Implementation for User Story 2

- [x] T040 [US2] Refactor AsyncState visuals | Objective: centralize loading, empty, and error rendering | Technical: update AsyncState to compose LoadingState, EmptyState, and ErrorState without changing its public props | Files: `apps/mobile/src/shared/feedback/AsyncState.tsx`, `apps/mobile/src/shared/ui/LoadingState.tsx`, `apps/mobile/src/shared/ui/EmptyState.tsx`, `apps/mobile/src/shared/ui/ErrorState.tsx` | Depends: T020, T039 | Done: all existing AsyncState call sites compile without prop changes | Risk: high affects many screens | Validation: `pnpm --filter mobile test` and manual forced async states
- [x] T041 [US2] Apply state copy and actions to list overview | Objective: improve empty/error recovery | Technical: ensure list overview empty, loading, and error states use shared visual treatment with retry and create-first-list action where already possible | Files: `apps/mobile/src/app/(app)/index.tsx`, `apps/mobile/src/shared/feedback/AsyncState.tsx`, `apps/mobile/src/shared/ui/EmptyState.tsx` | Depends: T040 | Done: empty list explains next step and error retry still calls `lists.refetch()` | Risk: medium copy/action interpretation | Validation: forced empty/error review
- [x] T042 [US2] Apply state visuals to list detail | Objective: improve item loading and empty list feedback | Technical: ensure detail loading/error and item empty states use shared state components while preserving refetch and item routes | Files: `apps/mobile/src/app/(app)/lists/[listId].tsx`, `apps/mobile/src/shared/feedback/AsyncState.tsx` | Depends: T040 | Done: empty item list and detail error states are visually consistent and actionable where possible | Risk: medium dense screen states | Validation: forced loading, empty, and error review
- [x] T043 [US2] Apply invalid and pending states to form components | Objective: make form feedback clear | Technical: use InvalidFieldText, AppInput invalid state, and AppButton loading/disabled state in auth, list, item, and product forms without schema changes | Files: `apps/mobile/src/features/auth/LoginForm.tsx`, `apps/mobile/src/features/auth/RegisterForm.tsx`, `apps/mobile/src/features/shopping-list/ShoppingListForm.tsx`, `apps/mobile/src/features/shopping-list-items/ShoppingListItemForm.tsx`, `apps/mobile/src/features/products/ProductForm.tsx` | Depends: T017, T020, T040 | Done: validation messages remain the same and pending submit is visually distinct | Risk: high touches multiple forms | Validation: existing form tests and manual invalid/pending states
- [x] T044 [US2] Apply state visuals to product and insights surfaces | Objective: complete state consistency | Technical: migrate product create/picker, duplicate notice, insights, and price comparison feedback to shared cards/status/state variants | Files: `apps/mobile/src/app/(app)/products/new.tsx`, `apps/mobile/src/features/products/ProductPicker.tsx`, `apps/mobile/src/features/products/DuplicateProductNotice.tsx`, `apps/mobile/src/app/(app)/lists/[listId]/insights.tsx`, `apps/mobile/src/features/insights/PriceComparisonIndicator.tsx` | Depends: T040, T043 | Done: states and notices use shared tones and no route/API behavior changes | Risk: medium broad visual touch | Validation: manual product and insights review
- [x] T045 [US2] US2 validation checkpoint | Objective: prove state consistency | Technical: record loading, empty, error, invalid, disabled, success, and warning examples in visual QA notes | Files: `specs/002-mobile-ui-polish/visual-qa.md`, `apps/mobile/src/shared/feedback/AsyncState.tsx`, `apps/mobile/src/shared/ui/ErrorState.tsx` | Depends: T041, T042, T043, T044 | Done: 100% of existing loading/empty/error states have styled user-facing meaning | Risk: low validation-only | Validation: `pnpm --filter mobile typecheck`, `pnpm --filter mobile lint`, `pnpm --filter mobile test`

## Phase 5: User Story 3 - Maintain a Reusable Visual Foundation for Future Screens (Priority: P3)

**Goal**: Future UI work can reuse the foundation without copying styles or reintroducing wireframe-like screens.

**Independent Test**: Review the shared design-system and shared UI modules and confirm a new screen can use consistent layout, heading, card, input, button, list, and visual-state patterns.

### Implementation for User Story 3

- [x] T046 [P] [US3] Design-system usage guide | Objective: prevent future drift | Technical: document allowed imports, token usage, variants, migration examples, and anti-patterns such as raw colors and duplicated card styles | Files: `apps/mobile/src/shared/design-system/README.md`, `specs/002-mobile-ui-polish/quickstart.md` | Depends: T021 | Done: guide shows how to create a new screen using shared primitives | Risk: low documentation-only | Validation: reviewer can implement a screen from the guide
- [x] T047 [P] [US3] Dark-mode readiness note | Objective: make future dark mode easy | Technical: document semantic theme mapping rules and forbid screen-level light color assumptions | Files: `apps/mobile/src/shared/design-system/README.md`, `apps/mobile/src/shared/design-system/themes.ts` | Depends: T009 | Done: future dark mode can add a second theme without rewriting migrated screens | Risk: low documentation-only | Validation: semantic theme names appear in guide and theme module
- [x] T048 [US3] Remove duplicated visual styles in migrated files | Objective: reduce inconsistency | Technical: replace repeated inline colors, radius, shadows, spacing, button/input/card/list styling in migrated auth/list/product/insights files with shared variants | Files: `apps/mobile/src/app/(auth)/login.tsx`, `apps/mobile/src/app/(auth)/register.tsx`, `apps/mobile/src/app/(app)/index.tsx`, `apps/mobile/src/app/(app)/lists/[listId].tsx`, `apps/mobile/src/features/shopping-list/ShoppingListCard.tsx` | Depends: T037, T045 | Done: no migrated screen repeats the same card/list/form state style locally | Risk: medium cleanup can alter visuals | Validation: `rg -n \"style=\\{\\{|borderRadius|borderWidth|padding:|color=\\\"\\$gray|color=\\\"\\$red\" apps/mobile/src/app apps/mobile/src/features`
- [x] T049 [US3] Add visual consistency review checklist | Objective: support future code review | Technical: add checklist for raw colors, duplicate spacing, component reuse, accessibility labels, long text, and state coverage | Files: `specs/002-mobile-ui-polish/visual-qa.md`, `apps/mobile/src/shared/design-system/README.md` | Depends: T046, T048 | Done: checklist can be reused on future PRs | Risk: low documentation-only | Validation: checklist maps to spec success criteria SC-001 through SC-006
- [x] T050 [US3] US3 validation checkpoint | Objective: verify reusable foundation | Technical: create a small non-routed usage example or documented snippet showing ScreenContainer, SectionHeader, AppCard, AppButton, AppInput, AppListItem, and state components together | Files: `apps/mobile/src/shared/design-system/README.md`, `apps/mobile/src/shared/ui/index.ts` | Depends: T046, T047, T048, T049 | Done: future screen authors can compose the foundation without new style decisions | Risk: low docs/example only | Validation: `pnpm --filter mobile typecheck`

## Final Phase: Polish, Accessibility, Performance, and Release Validation

**Purpose**: Cross-cutting checks after desired user stories are complete.

- [x] T051 Accessibility review | Objective: ensure mobile usability | Technical: verify labels, icon-only actions, text contrast, disabled state visibility, invalid field association, and 44px touch targets across migrated screens | Files: `specs/002-mobile-ui-polish/visual-qa.md`, `apps/mobile/src/shared/ui/AppButton.tsx`, `apps/mobile/src/shared/ui/AppListItem.tsx`, `apps/mobile/src/shared/ui/AppInput.tsx` | Depends: T037, T045 | Done: issues are fixed or documented as follow-ups | Risk: medium accessibility issues can be subtle | Validation: manual accessibility checklist and route smoke tests
- [x] T052 Responsive layout review | Objective: protect small screens | Technical: test long product names, large prices, helper messages, stacked actions, and no-overlap behavior on small and regular mobile viewport sizes | Files: `specs/002-mobile-ui-polish/visual-qa.md`, `apps/mobile/src/app/(app)/lists/[listId].tsx`, `apps/mobile/src/features/shopping-list-items/ShoppingListItemRow.tsx` | Depends: T037, T045 | Done: no text/control overlap is observed in target scenarios | Risk: medium device-specific layout | Validation: manual Expo review on small and regular viewport
- [x] T053 Performance review | Objective: preserve React Native responsiveness | Technical: check shared components for avoidable expensive work, unnecessary render-time object churn in dense list rows, and avoid new heavy dependencies | Files: `apps/mobile/src/shared/ui/AppListItem.tsx`, `apps/mobile/src/features/shopping-list-items/ShoppingListItemRow.tsx`, `apps/mobile/package.json` | Depends: T035, T044 | Done: no new heavy UI dependency added and dense list row remains lightweight | Risk: medium list performance | Validation: inspect dependencies and manual scroll interaction
- [x] T054 Visual consistency review | Objective: meet success criteria | Technical: compare migrated screens against visual QA checklist for hierarchy, spacing, colors, radius, shadows, typography, and state tone consistency | Files: `specs/002-mobile-ui-polish/visual-qa.md`, `apps/mobile/src/shared/design-system/tokens.ts`, `apps/mobile/src/shared/design-system/variants.ts` | Depends: T050, T051, T052 | Done: at least 90% repeated elements are consistent and deviations are documented | Risk: low review-only | Validation: checklist signed off in `visual-qa.md`
- [x] T055 Navigation and behavior regression check | Objective: ensure no feature changes slipped in | Technical: verify route strings, form schemas, query/mutation hooks, application use cases, APIs, and backend adapters were not intentionally changed | Files: `apps/mobile/src/app`, `apps/mobile/src/features`, `apps/mobile/src/application`, `apps/mobile/src/infrastructure` | Depends: T037, T045 | Done: no business-rule, navigation, API, or backend changes exist beyond presentational wiring | Risk: high if accidental behavior drift occurred | Validation: `git diff -- apps/mobile/src/application apps/mobile/src/domain apps/mobile/src/infrastructure apps/mobile/src/features`
- [x] T056 Final command validation | Objective: produce implementation confidence | Technical: run the required project checks after all visual changes | Files: `apps/mobile/package.json`, `package.json`, `specs/002-mobile-ui-polish/quickstart.md` | Depends: T051, T052, T053, T054, T055 | Done: typecheck, lint, and tests pass or failures are documented with cause | Risk: low validation-only | Validation: `pnpm --filter mobile typecheck`, `pnpm --filter mobile lint`, `pnpm --filter mobile test`
- [x] T057 Final Expo visual smoke | Objective: verify runtime compatibility | Technical: launch Expo and manually inspect auth, list overview, list detail, item form, product form, insights, empty, loading, and error states | Files: `specs/002-mobile-ui-polish/visual-qa.md`, `apps/mobile/app.json`, `apps/mobile/App.tsx` | Depends: T056 | Done: visual QA notes record pass/fail and screenshots or references | Risk: medium runtime-only issues | Validation: `pnpm --filter mobile start`
- [x] T058 Final rollback notes | Objective: make release safe | Technical: document rollback units for token/theme, shared components, state refactor, auth migration, list migration, product/insights migration, and polish changes | Files: `specs/002-mobile-ui-polish/visual-qa.md`, `specs/002-mobile-ui-polish/tasks.md` | Depends: T057 | Done: reviewer can identify smallest revert path for each major slice | Risk: low documentation-only | Validation: rollback notes match completed task phases

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 Setup and Visual Audit**: Starts immediately.
- **Phase 2 Foundational Visual System**: Depends on T003 and blocks all user-story migration.
- **Phase 3 US1 MVP**: Depends on T023. Delivers visual hierarchy for primary shopping flows.
- **Phase 4 US2**: Depends on T020 and is safest after US1 starts using shared components; T038 and T039 can run once state components exist.
- **Phase 5 US3**: Depends on shared foundation and should finish after migrated files reveal real reuse patterns.
- **Final Phase**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2. No dependency on US2 or US3 for MVP.
- **US2 (P2)**: Requires visual state components from Phase 2; can run partly in parallel with late US1 once AsyncState impact is coordinated.
- **US3 (P3)**: Requires foundation and enough migration examples to document reusable patterns accurately.

### Suggested MVP Scope

Complete Phase 1, Phase 2, and Phase 3 only. Stop after T037 to validate that the app no longer feels like a wireframe in primary shopping flows while preserving navigation, business rules, APIs, and form behavior.

## Parallel Opportunities

- T002 and T003 can run in parallel with T001.
- T005 through T008 should run sequentially because they intentionally build one `tokens.ts` file.
- T014 through T020 can run in parallel after T010 because they create separate component files.
- T024 and T025 can run in parallel after T021.
- T027 and T028 can run in parallel after T026 if auth form ownership is split by file.
- T038 and T039 can run in parallel after T020.
- T046 and T047 can run in parallel after T021 and T009.
- T051, T052, and T053 can run in parallel after migrated screens are stable.

## Parallel Example: User Story 1

```bash
# After Phase 2 completes:
Task: "T024 [US1] Add shared component render tests in apps/mobile/tests/unit/shared/ui-foundation.test.tsx"
Task: "T025 [US1] Add route smoke tests in apps/mobile/tests/integration/routes-auth-list.test.tsx"

# After T026 completes:
Task: "T027 [US1] Migrate LoginForm visuals in apps/mobile/src/features/auth/LoginForm.tsx"
Task: "T028 [US1] Migrate RegisterForm visuals in apps/mobile/src/features/auth/RegisterForm.tsx"
```

## Parallel Example: User Story 2

```bash
# After visual state components exist:
Task: "T038 [US2] Add visual state tests in apps/mobile/tests/unit/shared/visual-states.test.tsx"
Task: "T039 [US2] Add AsyncState regression tests in apps/mobile/tests/unit/shared/async-state.test.tsx"

# After AsyncState is refactored:
Task: "T041 [US2] Apply state visuals to list overview in apps/mobile/src/app/(app)/index.tsx"
Task: "T042 [US2] Apply state visuals to list detail in apps/mobile/src/app/(app)/lists/[listId].tsx"
```

## Parallel Example: User Story 3

```bash
# After shared foundation exists:
Task: "T046 [US3] Document design-system usage in apps/mobile/src/shared/design-system/README.md"
Task: "T047 [US3] Document dark-mode readiness in apps/mobile/src/shared/design-system/README.md"
```

## Implementation Strategy

### MVP First

1. Complete T001 through T023.
2. Complete T024 through T037.
3. Stop and validate visual hierarchy, existing route behavior, and primary shopping flow step counts.

### Incremental Delivery

1. Foundation first: directories, tokens, theme, variants, config, and additive components.
2. MVP migration: auth, list overview, list cards, list detail, budget, and item rows/forms.
3. State consistency: AsyncState and visual state adoption.
4. Reuse hardening: docs, duplicate style removal, consistency guardrails.
5. Polish: accessibility, responsiveness, performance, and final Expo validation.

### Rollback Strategy

- Revert token/theme/config changes separately from screen migrations.
- Revert one screen group at a time if a route-level visual change regresses.
- Keep shared components additive until at least one migrated screen validates them.
- Prefer variant-level fixes for broad visual inconsistencies and screen-level fixes only for isolated layout needs.

## Format Validation

- All task lines start with `- [ ]`.
- All tasks use sequential IDs T001 through T058.
- All user-story implementation tasks include `[US1]`, `[US2]`, or `[US3]`.
- All tasks include at least one exact file or directory path.
- All tasks include objective, technical description, dependencies, done criteria, risk, and validation.
