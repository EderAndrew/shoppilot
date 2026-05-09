# Application Contracts: Monthly Shopping MVP

These contracts define the boundaries tasks must preserve. They are planning
contracts, not final code.

## Layer Dependency Rule

```text
Presentation -> Feature hooks -> Application use cases -> Repository ports
Repository ports -> Infrastructure adapters
Application use cases -> Domain entities/services
Domain -> no dependencies on Presentation, Application, or Infrastructure
```

Presentation must never import Supabase clients or database DTO modules.

## Repository Ports

### AuthRepository

Responsibilities:

- register with email/password
- login with email/password
- logout
- restore current session
- expose authenticated user id to application use cases

Return behavior:

- returns safe auth state only
- never returns raw tokens to UI
- maps provider errors to safe app errors

### ShoppingListRepository

Responsibilities:

- create list
- list current user's lists
- get list with items
- complete list
- archive list

Ownership:

- every method receives or derives authenticated user id
- no method accepts arbitrary user-scoped reads without ownership enforcement

### ProductRepository

Responsibilities:

- create product
- search/list reusable products for current user
- get product by id for current user
- detect likely duplicate product candidates

### ShoppingListItemRepository

Responsibilities:

- add item
- update item
- remove item
- mark item bought
- list items by shopping list

Rules:

- item total is derived by domain before persistence
- adapters verify list and product ownership through user-scoped queries

### PriceHistoryRepository

Responsibilities:

- append price record
- get latest previous price for a product
- list price history by product

Rules:

- no normal update/delete methods
- current price insert must not overwrite previous rows

### UserEventRepository

Responsibilities:

- append user event
- optionally list user events for diagnostics/future analytics

Rules:

- no normal update/delete methods
- metadata must be safe and bounded

## Use Case Contracts

### CreateShoppingList

Input:

- name
- budget

Output:

- created ShoppingList
- budget summary with zero spent

Side effects:

- records `SHOPPING_LIST_CREATED`

### AddShoppingListItem

Input:

- shopping list id
- product id or product creation reference
- quantity
- unit price

Output:

- created ShoppingListItem
- updated budget summary
- optional price insight using previous history

Side effects:

- appends `price_history`
- records `ITEM_ADDED`
- records `PRICE_RECORDED`

### UpdateShoppingListItem

Input:

- item id
- optional quantity
- optional unit price
- optional bought status

Output:

- updated ShoppingListItem
- updated budget summary
- updated price insight if price changed

Side effects:

- records `ITEM_UPDATED`
- appends `price_history` and records `PRICE_RECORDED` if price changed

### RemoveShoppingListItem

Input:

- item id

Output:

- success status
- updated budget summary

Side effects:

- records `ITEM_REMOVED`
- does not delete price history

### CheckShoppingListItem

Input:

- item id
- bought state

Output:

- updated item

Side effects:

- records `ITEM_CHECKED` when item becomes bought

### CompleteShoppingList

Input:

- shopping list id

Output:

- completed ShoppingList

Side effects:

- records `SHOPPING_LIST_COMPLETED`

### CalculatePriceInsight

Input:

- product id
- current unit price

Output:

- status: `more_expensive`, `cheaper`, `unchanged`, or `no_history`
- absolute difference when previous price exists
- percentage difference when previous price exists

Side effects:

- none

## Route Contracts

| Route | Purpose | Required state | Primary actions |
|-------|---------|----------------|-----------------|
| `(auth)/login` | Sign in | signed out | login, go to register |
| `(auth)/register` | Create account | signed out | register, go to login |
| `(app)/index` | List overview | signed in | create list, open list, complete/archive |
| `(app)/lists/new` | Create list | signed in | submit list form |
| `(app)/lists/[listId]` | Active list detail | signed in and owns list | add item, edit item, check item, remove item, complete list |
| `(app)/lists/[listId]/item-new` | Add item | signed in and owns list | select/create product, enter quantity/price |
| `(app)/lists/[listId]/item-[itemId]` | Edit item | signed in and owns item | edit quantity/price, check, remove |
| `(app)/products/new` | Create product | signed in | submit product form |
| `(app)/lists/[listId]/insights` | Simple insights | signed in and owns list | review price comparison states |

## Query Key Contract

All query keys must be user-safe and avoid embedding sensitive values.

- `['auth', 'session']`
- `['shoppingLists']`
- `['shoppingList', listId]`
- `['shoppingListItems', listId]`
- `['products', searchTerm]`
- `['product', productId, 'latestPrice']`
- `['priceHistory', productId]`
- `['priceInsight', productId, currentPrice]`

## Error Contract

Application errors exposed to UI use safe categories:

- `validation_error`
- `auth_required`
- `forbidden`
- `not_found`
- `network_error`
- `conflict`
- `unexpected`

Errors must include a user-safe message and may include a safe correlation id.
They must not include tokens, raw SQL, provider secrets, or raw session payloads.
