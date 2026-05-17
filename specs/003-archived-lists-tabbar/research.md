# Research: Archived Lists, Tab Bar & Reusable Product Search

**Feature**: 003-archived-lists-tabbar  
**Date**: 2026-05-06  
**Method**: Live codebase audit

---

## Decision 1: Route restructuring strategy

**Decision**: Introduce a `(tabs)` group nested inside the existing `(app)` group. The `(app)/_layout.tsx` becomes a root Stack (auth guard + modal host) that contains `(tabs)` as its primary child. Each tab owns its own inner Stack.

**Rationale**: This is the canonical Expo Router pattern for tabs-with-modals. The auth guard logic stays in `(app)/_layout.tsx`; the tabs are children of that Stack so modal screens at the `(app)` level (e.g., `products/new.tsx`) sheet over all tabs correctly.

**Alternatives considered**:
- Keeping Stack-only navigation and simulating tabs with a custom component → rejected; non-standard, harder to maintain, no deep-link support.
- Moving auth guard to root `_layout.tsx` → rejected; would expose `(auth)` screens to the same layout, requiring more conditional logic.

---

## Decision 2: Active list filtering — repository level vs use-case level

**Decision**: Add separate `listActive()` and `listArchived()` methods to the `ShoppingListRepository` port and implement them in `SupabaseShoppingListRepository`. Pair with distinct use cases (`ListActiveShoppingLists`, `ListArchivedShoppingLists`) and query keys (`queryKeys.shoppingLists.active()`, `queryKeys.shoppingLists.archived()`).

**Rationale**: Filtering at the database level avoids fetching unnecessary data. The existing architecture already separates port → repository → use case → query hook; adding per-status variants follows the same pattern without inventing new abstractions.

**The status field**: Confirmed `status: "active" | "completed" | "archived"` on `ShoppingList` entity (packages/shared/src/domain-types/shopping.ts). Lists tab shows `status !== "archived"`. Archived tab shows `status === "archived"`.

**Cache invalidation**: Extend `queryKeys.shoppingLists` with nested keys:
```
queryKeys.shoppingLists.all()      → ["shoppingLists"]          (parent, used for invalidation)
queryKeys.shoppingLists.active()   → ["shoppingLists", "active"]
queryKeys.shoppingLists.archived() → ["shoppingLists", "archived"]
```
`invalidateQueries(queryKeys.shoppingLists.all())` cascades to both sub-keys automatically.

**Alternatives considered**:
- Client-side filter in the React Query `select` option → rejected; fetches all data including archived, wastes bandwidth.
- Single query with filter prop → rejected; complicates cache key management and makes it harder to have separate query states per tab.

---

## Decision 3: "Reusable product" definition

**Decision**: All products that exist in the `products` table are treated as reusable. There is no `isReusable` flag. The `ProductPicker` already displays the message "Nenhum produto reutilizável encontrado" — the semantic intent ("reusable = already in your catalog") is already correct. No data model change needed.

**Rationale**: Auditing `Product` entity (`domain/entities/Product.ts`) and `ProductRecord` port confirms no reusable flag exists. The product catalog IS the reusable product catalog by design.

**Alternatives considered**:
- Adding an `isReusable` boolean to `Product` → rejected; out of scope, would require migration, adds complexity without solving the actual UI problem.

---

## Decision 4: ProductPicker UI fix strategy

**Decision**: Modify `ProductPicker.tsx` to remove the rendered list of results. Replace with:
- Empty state (input empty or query too short): nothing rendered below input.
- Match found: pre-fill/suggest first match via the existing `onSelect` flow, show no list.
- No match found (query non-empty, results empty): render only "Nenhum produto reutilizável encontrado" text.

**Rationale**: The component already has all the data and the "not found" message. The fix is purely presentational — remove the `FlatList`/map rendering block, keep the search logic.

**Alternatives considered**:
- Full autocomplete with keyboard navigation → explicitly out of scope; adds complexity and visual clutter.
- Replacing ProductPicker entirely → rejected; no need, the search logic works correctly.

---

## Decision 5: Logout migration to User tab

**Decision**: Create `(app)/(tabs)/user/index.tsx` as a minimal screen showing user email + logout button. Remove the `headerRight` logout button from `(app)/_layout.tsx` (or the new tabs layout).

**Rationale**: `useLogoutMutation()` in `features/auth/auth.queries.ts` is self-contained — it clears session and query cache. It can be dropped into any screen without coupling to the header.

---

## Decision 6: Archived list date format

**Decision**: Use `Mês/AAAA` format (e.g., `Maio/2026`) in Portuguese to match the app's language (UI already uses Portuguese labels like "Sair", "Nenhum produto reutilizável encontrado"). Use `Intl.DateTimeFormat` with `{ month: 'long', year: 'numeric' }` and `pt-BR` locale.

**Rationale**: The app is already in Portuguese. Long-form month is more readable on a card and matches the design system's emphasis on clarity.

**Alternatives considered**:
- `MM/AAAA` (e.g., `05/2026`) → acceptable fallback, but less readable.
- Using an existing date utility if present → check `src/shared/` for formatters; if absent, implement inline in the archived list card.

---

## Decision 7: ShoppingListCard reuse for archived screen

**Decision**: Reuse `ShoppingListCard` (`features/shopping-list/ShoppingListCard.tsx`) for the archived list entries. Extend it with an optional `showDate` prop (or create a thin `ArchivedListCard` wrapper) to display the month/year below the list name.

**Rationale**: `ShoppingListCard` already accepts `ShoppingListRecord` and `onPress`. The `archivedAt` field is available on the record. A thin extension avoids duplication.

**Alternatives considered**:
- Duplicate the component → rejected; maintenance burden.
- Add a completely new component → only warranted if the archived card diverges significantly from the active card. For now it won't.

---

## Resolved NEEDS CLARIFICATION Items

All assumptions from spec.md are now confirmed:

| Assumption | Confirmed? | Finding |
|------------|-----------|---------|
| Archive field = `status` | ✅ | `status: "archived"` — also has `archivedAt` timestamp |
| No new DB entities needed | ✅ | No new tables or columns required |
| All products are "reusable" | ✅ | No isReusable flag; product catalog = reusable catalog |
| Date field exists | ✅ | `archivedAt: string \| null` on ShoppingListRecord |
| Expo Router `(tabs)` pattern | ✅ | Current app has no tabs; adding `(tabs)` group is additive |
| Design system in Tamagui | ✅ | Tamagui tokens/components used throughout |
