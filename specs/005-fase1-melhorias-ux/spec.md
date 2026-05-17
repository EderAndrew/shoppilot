# Fase 1 de Melhorias de UX — ShopPilot

## Overview

Improve the core user experience of the ShopPilot mobile app by resolving five friction points that reduce daily usability: forced re-authentication on every app open, inability to edit items after they are added, missing brand field on items, no clear protection against editing archived lists, and no visible app version for users.

## Problem Statement

Users today must log in every time they open the app, even with a valid existing session. After adding an item to a shopping list, there is no way to correct the product name, brand, quantity, or price without removing and re-adding it. The item form has no brand field, so brand information is lost. Archived lists have no UI or service-layer guard preventing inadvertent edits, causing confusion. Finally, there is no way for a user to know which app version they are running, making support difficult.

## User Scenarios & Testing

### Scenario 1: Returning user opens app with a valid session
**Given** a user who logged in previously and has not explicitly logged out  
**When** they reopen the app  
**Then** they land directly on their shopping lists without seeing the login screen

### Scenario 2: Session expires between app opens
**Given** a user whose session has expired  
**When** they reopen the app  
**Then** they are redirected to the login screen to re-authenticate

### Scenario 3: User logs out explicitly
**Given** a logged-in user  
**When** they tap "Sair" (Logout)  
**Then** they are taken to the login screen and their session is cleared both locally and on the server

### Scenario 4: Logout prevents session restoration
**Given** a user who has just logged out  
**When** they reopen the app without logging in again  
**Then** they remain on the login screen (the previous session is not auto-restored)

### Scenario 5: User edits an item in an active list
**Given** a user viewing an active shopping list  
**When** they tap the edit action on an item  
**Then** they see a form pre-filled with the item's current product name, brand, quantity, and price  
**And** can save changes that immediately reflect in the list

### Scenario 6: Edit fails with a clear error
**Given** a user editing an item  
**When** they submit a form with invalid values (e.g. negative quantity)  
**Then** they see a clear, field-level error message and the item is not updated

### Scenario 7: User adds a new item with a brand
**Given** a user adding a new item to an active shopping list  
**When** they fill in the item form  
**Then** the form includes an optional "Marca" (Brand) field alongside Product, Quantity, and Price  
**And** the brand is stored and visible on the item row after saving

### Scenario 8: User adds an item without a brand
**Given** a user adding a new item  
**When** they leave the Brand field empty and submit  
**Then** the item is saved successfully and displays without a brand value

### Scenario 9: User attempts to edit an item in an archived list
**Given** a user viewing an archived shopping list  
**When** they look at the items  
**Then** no edit or remove actions are available  
**And** a clear message indicates the list is read-only

### Scenario 10: Service rejects mutation on an archived list
**Given** an archived shopping list  
**When** any edit or delete action is attempted programmatically on its items  
**Then** the operation is rejected with an error at the service/data layer

### Scenario 11: User sees app version on login screen
**Given** any user on the login screen  
**When** they look at the screen  
**Then** the current app version is visible unobtrusively (e.g. bottom of the screen)

### Scenario 12: User sees app version on profile screen
**Given** a logged-in user on the user profile screen  
**When** they look at the screen  
**Then** the current app version is visible unobtrusively

## Functional Requirements

### FR-1: Persistent Authentication Session

1.1 The app must restore a valid authenticated session automatically when reopened, without prompting the user to log in again.  
1.2 Sessions must survive app restarts and remain valid across multiple days until the user explicitly logs out or the session expires.  
1.3 Sessions that are close to expiry must refresh automatically in the background, if the auth mechanism supports it.  
1.4 When a session has expired and cannot be refreshed, the user must be redirected to the login screen.  
1.5 The "Sair" (Logout) action must invalidate the session both locally on the device and on the server.  
1.6 After explicit logout, reopening the app must not auto-restore the previous session.

### FR-2: Item Editing

2.1 Each item in an **active** shopping list must expose an edit action directly from the list view.  
2.2 The edit form must be pre-populated with the item's current product name, brand, quantity, and price.  
2.3 Validation rules for editing must be identical to those for creating an item.  
2.4 After a successful save, the list view must reflect the updated item without requiring a manual refresh.  
2.5 The UI must communicate loading, success, and error states during the save operation.  
2.6 The add and edit flows must share the same validation logic to avoid divergence.

### FR-3: Brand Field on Items

3.1 The item creation form must include an optional "Marca" (Brand) field.  
3.2 Items may be saved without a brand; the field is not required.  
3.3 The brand value must be persisted to and retrieved from the data store.  
3.4 When a brand is present on an item, it must be visible in the list row or item detail.  
3.5 The item edit form must include the Brand field with the same optional constraint.

### FR-4: Archived List Read-Only Enforcement

4.1 Items in an archived list must not be editable through the user interface.  
4.2 Items in an archived list must not be removable through the user interface.  
4.3 The archived list detail view must display a clear, prominent message indicating the list is read-only.  
4.4 The read-only rule must be enforced at the service/data layer as well; attempts to mutate items in an archived list must be rejected regardless of how they originate.

### FR-5: Visible App Version

5.1 The current app version must be displayed on the login screen in an unobtrusive location.  
5.2 The current app version must be displayed on the user profile/settings screen in an unobtrusive location.  
5.3 The version value must come from a single authoritative source — the app configuration/manifest — not hardcoded in individual components.

## Success Criteria

1. A returning user with a valid session reaches their shopping lists in 0 additional login prompts — measured across a clean app restart with a non-expired session.
2. A user can open an item edit form in 2 taps or fewer from the list view.
3. 100% of item create and edit submissions that include a brand persist and display the brand value correctly.
4. Archived list items expose zero edit or remove actions in the UI, verified by manual review of the archived list screen.
5. Attempts to update or delete items in an archived list via the service layer return an error in 100% of cases.
6. The app version is visible on both the login screen and the user profile screen without requiring any navigation or interaction.
7. Explicit logout prevents session restoration on the next app open, verified in 100% of manual test runs.

## Assumptions

- The existing auth mechanism supports local session storage and automatic token refresh; no server-side auth infrastructure changes are needed.
- "Brand" is a free-text, optional string with no predefined list of values; brand autocomplete or validation against a catalog is out of scope for this phase.
- The archived status of a list is determined server-side and already stored; this feature adds enforcement on top of the existing status flag without changing archiving business logic.
- App version is already declared in the app configuration file; no new versioning infrastructure or release process changes are needed.
- Price comparison by brand is explicitly out of scope for this phase and will be addressed in a future spec.

## Out of Scope

- Offline-first mode, local SQLite storage, or background sync queues.
- Automatic or manual price comparison grouped by brand.
- Multi-user households or shared shopping lists.
- Changes to the archiving business rules beyond enforcing read-only on items.
- Push notifications.
- Barcode scanning or OCR.

## Key Entities

| Entity | Relevant Change |
|---|---|
| ShoppingListItem | Gains optional `brand` field on create and edit |
| ShoppingList | Archived status actively enforces read-only on its items |
| UserSession | Persisted locally across restarts; refreshed automatically; fully cleared on logout |
| AppVersion | Surfaced on login and profile screens from a single centralized source |
