# Feature Specification: Monthly Shopping MVP

**Feature Branch**: `001-monthly-shopping-mvp`  
**Created**: 2026-05-04  
**Status**: Draft  
**Input**: User description: "Criar a especificacao da Fase 1 do MVP para um aplicativo mobile de compras mensais de supermercado com controle de orcamento e historico de precos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Track Monthly Shopping List (Priority: P1)

As an authenticated shopper, I want to create a monthly grocery list with a
budget and add priced items, so I can see my current total, remaining budget, and
budget usage while shopping.

**Why this priority**: This is the core MVP value. Without list creation, item
entry, and budget tracking, the app cannot help the user control monthly grocery
spending.

**Independent Test**: A new user can create an account, sign in, create one
active list with a budget, add multiple items with quantity and unit price, and
see correct budget totals without relying on price history or insights.

**Acceptance Scenarios**:

1. **Given** a signed-in user with no shopping lists, **When** they create a list with a name and budget, **Then** the list appears as active with its creation date and zero current total.
2. **Given** an active list with a budget, **When** the user adds an item with quantity and unit price, **Then** the item total, list total, remaining amount, and used percentage are recalculated immediately.
3. **Given** an active list near its budget limit, **When** the user adds or edits an item so the total exceeds the budget, **Then** the app shows a clear over-budget warning.
4. **Given** a signed-in user, **When** they sign out and reopen the app later, **Then** they can sign back in and continue from their own persisted shopping data.

---

### User Story 2 - Reuse Products and Compare Prices (Priority: P2)

As a shopper, I want products to be reusable across future lists and to see how
the current price compares with the previous recorded price, so I can make
better purchase decisions.

**Why this priority**: Price history turns the list from a simple calculator into
a shopping decision tool and creates the data foundation for future insights.

**Independent Test**: A user can create a product, record a price on one list,
use the same product again on another list, and see whether the new price is
more expensive, cheaper, or has no previous history.

**Acceptance Scenarios**:

1. **Given** a signed-in user creating an item, **When** the product does not exist yet, **Then** they can create a reusable product with a name and optional brand, barcode, and unit.
2. **Given** a product with prior price history, **When** the user adds it to a list with a new unit price, **Then** the app shows the absolute and percentage difference from the latest previous price.
3. **Given** a product without prior price history, **When** the user adds it to a list, **Then** the app indicates that no comparison is available yet.
4. **Given** an item whose unit price is edited, **When** the edit is saved, **Then** a new price record is added and previous price records remain available.

---

### User Story 3 - Complete Lists and Preserve Audit Events (Priority: P3)

As a shopper, I want to mark items and lists as completed while the app records
important shopping events, so I can review what happened and the product can
support future analytics and agentic assistance.

**Why this priority**: Completion and event capture close the shopping lifecycle
and prepare the system for later forecasting and intelligent suggestions.

**Independent Test**: A user can mark items as bought, complete a shopping list,
archive old lists, and verify that relevant events are recorded for the user's
own actions.

**Acceptance Scenarios**:

1. **Given** an active list with items, **When** the user marks an item as bought, **Then** the item status changes without changing historical price records.
2. **Given** an active list, **When** the user completes it, **Then** the list status becomes completed and it no longer appears as an active shopping task.
3. **Given** a completed list, **When** the user archives it, **Then** the list remains available for history but is separated from active and completed workflows.
4. **Given** any supported action, **When** the action succeeds, **Then** the app records the corresponding event for the authenticated user.

### Edge Cases

- If a user attempts to view or change another user's list, product, item, price history, or event, access is denied and no data is exposed.
- If a user enters a zero or negative quantity, unit price, or budget, the app rejects the input with a clear message before saving.
- If an item edit changes the price multiple times, each accepted price change creates a separate historical record.
- If the current product price equals the previous recorded price, the comparison shows no change.
- If a product has no previous price for that user, the comparison shows "sem historico" instead of implying a price trend.
- If a list has no items, budget totals show zero spent, the full budget remaining, and zero percent used.
- If an item is removed from a list, the list total updates while prior price history remains intact.
- If connectivity is interrupted during a save, the user receives feedback and the app does not show unsaved data as permanently recorded.
- If a duplicate product name is entered with the same optional identifying details, the app guides the user toward reusing the existing product.
- If required user session information is unavailable, the app prevents shopping data operations until the user signs in again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a person to register, sign in, maintain a secure session, and sign out.
- **FR-002**: The system MUST associate every shopping list, product, list item, price history record, and user event with the authenticated user.
- **FR-003**: The system MUST prevent users from reading, creating, updating, or deleting another user's shopping data.
- **FR-004**: Users MUST be able to create shopping lists with name, budget, status, and creation date.
- **FR-005**: Users MUST be able to view their shopping lists and open a selected list.
- **FR-006**: Users MUST be able to move a list through active, completed, and archived states.
- **FR-007**: Users MUST be able to create reusable products with name and optional brand, barcode, and unit.
- **FR-008**: Users MUST be able to add a product to a shopping list with quantity, unit price, calculated total price, and bought status.
- **FR-009**: Users MUST be able to edit, remove, and mark list items as bought.
- **FR-010**: The system MUST calculate each item total from quantity and unit price.
- **FR-011**: The system MUST calculate list budget total, current total, remaining amount, and percentage used from the list's items.
- **FR-012**: The system MUST show an over-budget warning whenever the current list total exceeds the list budget.
- **FR-013**: The system MUST update visible list totals immediately after item creation, edit, removal, or bought-status changes.
- **FR-014**: The system MUST record a new price history entry whenever a product price is inserted or changed through a list item.
- **FR-015**: The system MUST preserve price history as append-only records and MUST NOT overwrite or delete prior price entries during normal item edits.
- **FR-016**: The system MUST compare the current unit price with the latest previous price recorded for the same user's product.
- **FR-017**: The system MUST display price comparison as more expensive, cheaper, unchanged, or no history, including absolute and percentage difference when a prior price exists.
- **FR-018**: The system MUST record successful user events for SHOPPING_LIST_CREATED, SHOPPING_LIST_COMPLETED, PRODUCT_CREATED, ITEM_ADDED, ITEM_UPDATED, ITEM_REMOVED, ITEM_CHECKED, and PRICE_RECORDED.
- **FR-019**: User events MUST include user, event type, entity type, entity identifier, metadata, and creation time.
- **FR-020**: The system MUST validate required fields, numeric limits, ownership, and supported statuses before accepting changes.
- **FR-021**: The system MUST avoid exposing sensitive data in user-facing errors or operational logs.
- **FR-022**: The system MUST keep budget and price calculations consistent across all views where the same list or item is shown.
- **FR-023**: The system MUST keep shopping data access behind replaceable application boundaries so a future dedicated backend can provide the same user-facing behavior.
- **FR-024**: The system MUST keep business rules for totals, budget status, price history, and comparisons outside visual interface elements.

### Key Entities

- **User**: The authenticated owner of shopping data and events.
- **ShoppingList**: A monthly grocery planning unit with owner, name, budget, status, creation date, and behavior for totals and budget state.
- **ShoppingListItem**: A product entry inside a shopping list with quantity, unit price, calculated total, bought status, and relationship to its list and product.
- **Product**: A reusable grocery product owned by a user, with name and optional brand, barcode, and unit.
- **PriceHistory**: An append-only record of a product price for a user, associated with the product, list context, price, and date.
- **UserEvent**: An audit and analytics event for a successful user action, including event type, entity type, entity identifier, metadata, and creation time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of new users can create an account, sign in, create their first shopping list, and add the first item in under 5 minutes during usability testing.
- **SC-002**: 95% of item add/edit/remove actions update visible budget totals within 1 second under normal mobile network conditions.
- **SC-003**: 100% of accepted item prices create a price history record without modifying previous price records.
- **SC-004**: 100% of supported successful shopping actions produce the expected user event with the correct owner and entity reference.
- **SC-005**: 100% of cross-user access attempts in validation tests are denied without exposing another user's shopping data.
- **SC-006**: 95% of users can understand whether a product is more expensive, cheaper, unchanged, or without history without additional explanation.
- **SC-007**: Budget totals, remaining amount, and percentage used match independently calculated expected values in 100% of domain-rule tests.
- **SC-008**: The primary in-market flow from opening an active list to marking an item as bought requires no more than 3 user actions after the list is visible.

## Assumptions

- The MVP is single-user per account; shared household lists and multi-user collaboration are outside this phase.
- The app targets monthly supermarket shopping and does not cover restaurant, wholesale, or multi-store comparison workflows in Phase 1.
- Product barcode storage is allowed when manually entered, but barcode scanning is outside this phase.
- Price comparison uses the latest previous price for the same user's product, regardless of store, because market-level comparison is outside scope.
- The user may have intermittent connectivity while shopping; full offline operation is outside scope, but failed saves must be clear and safe.
- Data retention follows the product's append-only history goals unless a future privacy deletion workflow supersedes it.
- AI with language models, autonomous agents, notifications, OCR, and a dedicated backend are outside Phase 1.
- The existing mobile application stack and monorepo layout are fixed planning inputs; this specification defines the user-facing behavior and quality constraints they must support.
