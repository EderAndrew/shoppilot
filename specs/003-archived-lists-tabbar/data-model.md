# Data Model: Archived Lists, Tab Bar & Reusable Product Search

**Feature**: 003-archived-lists-tabbar  
**Date**: 2026-05-06

---

## Existing Entities (no schema changes needed)

### ShoppingList

Location: `apps/mobile/src/domain/entities/ShoppingList.ts`  
Shared types: `packages/shared/src/domain-types/shopping.ts`

```
ShoppingListProps
├── id: string
├── userId: string
├── name: string
├── month: number
├── year: number
├── budget: number | null
├── status: "active" | "completed" | "archived"   ← key for filtering
├── archivedAt: string | null                       ← used for month/year display
├── createdAt: string
└── updatedAt: string
```

**Status transitions**:
```
active ──→ completed ──→ archived
active ──────────────→ archived   (direct archive allowed)
```

**Filtering rules**:
- Lists tab: `status !== "archived"` (i.e., `active` or `completed`)
- Archived tab: `status === "archived"`

---

### Product

Location: `apps/mobile/src/domain/entities/Product.ts`  
Port: `apps/mobile/src/application/ports/ProductRepository.ts`

```
ProductProps / ProductRecord
├── id: string
├── userId: string
├── name: string
├── brand: string | null
├── barcode: string | null
├── unit: string | null
├── createdAt: string
└── updatedAt: string
```

**No reusable flag**: All products in the catalog are treated as reusable by design. No schema change.

---

## New Query Keys (application layer change only)

Location: `apps/mobile/src/application/query-keys/queryKeys.ts`

Current:
```ts
shoppingLists: {
  all: () => ["shoppingLists"] as const,
}
```

Extended:
```ts
shoppingLists: {
  all:      () => ["shoppingLists"] as const,
  active:   () => ["shoppingLists", "active"] as const,
  archived: () => ["shoppingLists", "archived"] as const,
}
```

Cache invalidation: `invalidateQueries(queryKeys.shoppingLists.all())` cascades to both `active` and `archived` sub-queries automatically via TanStack Query key prefix matching.

---

## New Repository Methods (port interface additions)

Location: `apps/mobile/src/application/ports/ShoppingListRepository.ts`

```ts
// Add alongside existing list():
listActive(): Promise<ShoppingListRecord[]>      // status != 'archived'
listArchived(): Promise<ShoppingListRecord[]>    // status == 'archived'
```

Implementation: `apps/mobile/src/infrastructure/repositories/SupabaseShoppingListRepository.ts`

```ts
async listActive(): Promise<ShoppingListRecord[]> {
  // .neq('status', 'archived')
}

async listArchived(): Promise<ShoppingListRecord[]> {
  // .eq('status', 'archived')
  // .order('archived_at', { ascending: false })
}
```

---

## New Use Cases (application layer)

Location: `apps/mobile/src/application/use-cases/shoppingLists.ts`

```
ListActiveShoppingLists
└── execute() → Promise<ShoppingListRecord[]>   (calls listActive())

ListArchivedShoppingLists
└── execute() → Promise<ShoppingListRecord[]>   (calls listArchived())
```

---

## New React Query Hooks (features layer)

Location: `apps/mobile/src/features/shopping-list/shoppingList.queries.ts`

```ts
useActiveShoppingListsQuery()   // replaces useShoppingListsQuery() on Lists tab
useArchivedShoppingListsQuery() // used on Archived tab
```

The existing `useShoppingListsQuery()` remains for backwards compatibility until confirmed unused.

---

## Navigation Route Structure (new)

```
app/
├── _layout.tsx                          (root — unchanged)
├── (auth)/
│   ├── _layout.tsx                      (unchanged)
│   ├── login.tsx                        (unchanged)
│   └── register.tsx                     (unchanged)
└── (app)/
    ├── _layout.tsx                      (MODIFY: Stack → auth guard + modal host)
    ├── products/
    │   └── new.tsx                      (unchanged — modal over tabs)
    └── (tabs)/
        ├── _layout.tsx                  (NEW: Tabs navigator, 3 tabs)
        ├── lists/
        │   ├── _layout.tsx              (NEW: Stack for Lists tab)
        │   ├── index.tsx                (MOVE from (app)/index.tsx + filter active)
        │   ├── new.tsx                  (MOVE from (app)/lists/new.tsx)
        │   └── [listId]/
        │       ├── _layout.tsx          (if needed — or keep as flat files)
        │       ├── index.tsx            (MOVE from (app)/lists/[listId].tsx)
        │       ├── item-new.tsx         (MOVE from (app)/lists/[listId]/item-new.tsx)
        │       ├── item-[itemId].tsx    (MOVE from (app)/lists/[listId]/item-[itemId].tsx)
        │       └── insights.tsx        (MOVE from (app)/lists/[listId]/insights.tsx)
        ├── archived/
        │   ├── _layout.tsx              (NEW: Stack for Archived tab)
        │   ├── index.tsx                (NEW: archived list screen)
        │   └── [listId]/
        │       └── index.tsx            (NEW: archived list detail — can share components with lists/[listId])
        └── user/
            └── index.tsx                (NEW: user screen with logout)
```

**Key rule**: The `[listId]` detail screen for archived lists reuses `ShoppingListDetail` components but rendered in read-mode (no add/edit item actions, or those actions are simply hidden since the list is archived).

---

## Component Extensions

### ShoppingListCard (existing)

Location: `apps/mobile/src/features/shopping-list/ShoppingListCard.tsx`

Add optional prop:
```ts
showArchivedDate?: boolean   // if true, renders archivedAt in Mês/AAAA format below name
```

Or create a thin `ArchivedListCard` wrapper that adds the date display, keeping the base card unchanged.

---

## No Database Changes

All changes are:
- TypeScript application layer (query keys, use cases, ports, hooks)
- File/route moves and additions (Expo Router restructuring)
- UI-only fix to `ProductPicker.tsx`
- No new Supabase tables, columns, or migrations required
