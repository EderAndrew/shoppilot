# Feature Specification: Archived Lists, Tab Bar & Reusable Product Search

**Feature Branch**: `003-archived-lists-tabbar`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: User description: "Archived Lists, Tab Bar navigation, and Reusable Product Search behavior"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tab Bar Navigation (Priority: P1)

As a user, I need a clear Tab Bar with dedicated areas for Lists, Archived, and User so I can navigate the app without confusion and access each section independently.

**Why this priority**: The Tab Bar is the structural foundation. Every other improvement (archived lists screen, user profile with logout) depends on this navigation layer being in place first.

**Independent Test**: Can be fully tested by launching the app and verifying three tabs appear (Lists, Archived, User). Each tab navigates to a distinct screen without breaking existing flows.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user views the bottom of the screen, **Then** a Tab Bar with three tabs — Lists, Archived, and User — is visible.
2. **Given** the Tab Bar is visible, **When** the user taps each tab, **Then** each tab navigates to its dedicated screen without errors.
3. **Given** the user is on the Lists tab, **When** they navigate into a list detail and then tap Archived, **Then** they land on the Archived screen (not inside the Lists stack).

---

### User Story 2 - Active Lists Show Only Non-Archived Lists (Priority: P1)

As a user, I want the main Lists screen to show only active (non-archived) lists so I can focus on my current shopping without visual clutter from past lists.

**Why this priority**: Tied with P1 Tab Bar because the problem is already occurring — archived lists polluting the main view. This is a direct pain point fix that is independent of the Tab Bar implementation.

**Independent Test**: Can be fully tested by archiving a list and confirming it no longer appears on the Lists tab. Delivers immediate user value even before the Archived tab is fully functional.

**Acceptance Scenarios**:

1. **Given** a list exists with archived status, **When** the user opens the Lists tab, **Then** the archived list does not appear in the list.
2. **Given** all existing lists are archived, **When** the user opens the Lists tab, **Then** an empty state is shown with no archived items visible.
3. **Given** a mix of active and archived lists, **When** the user opens the Lists tab, **Then** only the active (non-archived) lists are displayed.

---

### User Story 3 - Archived Lists Screen (Priority: P2)

As a user, I want a dedicated Archived screen where I can view my past shopping lists with their month/year, so I can review previous purchases without disrupting my active lists workflow.

**Why this priority**: Necessary to avoid lost data once archived lists are hidden from the main screen. Users need to be able to access historical lists.

**Independent Test**: Can be fully tested by archiving a list and navigating to the Archived tab to confirm it appears with the correct date format.

**Acceptance Scenarios**:

1. **Given** one or more archived lists exist, **When** the user taps the Archived tab, **Then** all archived lists are displayed, each showing the list name and its date in month/year format.
2. **Given** an archived list is displayed, **When** the user taps it, **Then** they can view the list details.
3. **Given** no archived lists exist, **When** the user opens the Archived tab, **Then** an empty state is shown.
4. **Given** an archived list, **When** its date is displayed, **Then** the format matches `Mês/AAAA` (e.g., `Maio/2026`) or `MM/AAAA` (e.g., `05/2026`) consistently with the app's existing date patterns.

---

### User Story 4 - Logout Moved to User Tab (Priority: P2)

As a user, I want the logout option to be in the User tab so the main Lists screen stays focused on shopping, and logout is safely tucked away in a profile-like area.

**Why this priority**: Depends on the Tab Bar (P1) being in place. Important for UX clarity but doesn't block the core lists workflow.

**Independent Test**: Can be fully tested by confirming the logout button is gone from the Lists screen and is present and functional in the User tab.

**Acceptance Scenarios**:

1. **Given** the app is open with a logged-in user, **When** the user taps the User tab, **Then** a screen is shown with a logout button.
2. **Given** the User tab screen, **When** the user taps logout, **Then** the session is terminated and the user is redirected to the login/auth screen.
3. **Given** the Lists tab, **When** the user views the Lists screen, **Then** no logout button or action is visible there.

---

### User Story 5 - Reusable Product Search in Item Form (Priority: P3)

As a user adding an item to a list, I want the product field to search only reusable products and show a subtle suggestion (not a visual list), so the form stays clean and I can type freely without unwanted UI clutter.

**Why this priority**: Addresses a UX annoyance in the item-add flow but does not block any critical functionality. The list feature is already working; this is a refinement.

**Independent Test**: Can be fully tested by opening the add-item form, typing a product name, and verifying no dropdown list appears. Instead, either a match suggestion is shown inline or the message "Nenhum produto reutilizável encontrado" is displayed.

**Acceptance Scenarios**:

1. **Given** the add-item form is open, **When** the user types a product name that matches a reusable product, **Then** the match is suggested (e.g., inline hint or pre-filled text) without rendering a visual dropdown list below the input.
2. **Given** the add-item form is open, **When** the user types a product name with no matching reusable product, **Then** only the message "Nenhum produto reutilizável encontrado" is shown — no list is rendered.
3. **Given** the add-item form, **When** the product field is focused but empty, **Then** no product list or dropdown is displayed.

---

### Edge Cases

- What happens when the user archives a list that is currently selected/open — does the active state clear?
- How does the app behave when the archived list has a null or missing date?
- What happens if the Archived tab is tapped while a list detail is open in the Lists stack?
- What if the user types special characters in the product search field?
- How does the User tab display when user email/profile data is unavailable?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Lists tab MUST display only lists whose status is not archived.
- **FR-002**: The Archived tab MUST display only lists whose status is archived.
- **FR-003**: Each list entry on the Archived screen MUST show its date in `Mês/AAAA` or `MM/AAAA` format.
- **FR-004**: The app MUST provide a Tab Bar with three tabs: Lists, Archived, and User.
- **FR-005**: Each tab MUST support an independent navigation stack (e.g., drilling into a list detail from Lists or Archived does not affect the other tabs).
- **FR-006**: The navigation structure MUST be designed to allow adding new tabs in the future without requiring restructuring of existing tabs.
- **FR-007**: The User tab MUST contain a logout button that terminates the session and redirects to authentication.
- **FR-008**: The Lists screen MUST NOT contain a logout button or logout action.
- **FR-009**: The product field in the add-item form MUST search only reusable products when the user types.
- **FR-010**: The product field MUST NOT render a visual list of products below the input at any time.
- **FR-011**: When a matching reusable product is found, the field MAY suggest or pre-fill the product name without showing a dropdown.
- **FR-012**: When no reusable product matches the typed text, the form MUST display only the message "Nenhum produto reutilizável encontrado".

### Key Entities

- **Shopping List**: Represents a shopping session; has a status field that differentiates active from archived lists, and a date indicating when the list was created or finalized.
- **Archived List**: A shopping list with archived status; immutable in the archived screen (no editing unless restore is triggered, which is out of scope).
- **Reusable Product**: A product entity flagged as reusable (exact field to be confirmed by code audit — likely `isReusable`, `reusable`, or a `type` field); used as a suggestion source in the item form.
- **Tab**: A top-level navigation destination (Lists, Archived, User) each with its own stack.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After archiving a list, it disappears from the Lists screen immediately — 100% of archived lists must be absent from the active view.
- **SC-002**: All archived lists appear on the Archived screen with the correct date format — 0 lists shown with missing or incorrectly formatted dates.
- **SC-003**: Users can navigate between all three tabs without any crashes, blank screens, or broken stacks.
- **SC-004**: Logout from the User tab successfully terminates the session on 100% of attempts, and the user is redirected to the auth screen.
- **SC-005**: The add-item product field never renders a visual list of products — verified across all typed inputs including empty, partial match, full match, and no-match states.
- **SC-006**: All existing features (list creation, item addition, archiving, list detail view) continue to work without regression after navigation restructuring.

## Assumptions

- The existing codebase already has a `status` or equivalent field on shopping lists that distinguishes archived from active lists; no new data model is needed.
- The existing reusable product model has a flag field (e.g., `isReusable` or similar) that can be used to filter search results; no new database entities are required.
- The Archived screen will display lists as read-only; no requirement to restore or edit archived lists from this screen.
- The User tab will show minimal content (logout button + basic user info like email); no full profile editor is expected.
- Date displayed on the Archived screen is the list's existing creation or finalization date — no new date field needs to be added.
- The app uses Expo Router, and the Tab Bar will follow the `(tabs)` group convention with nested stacks where needed.
- The current design system (Tamagui tokens, typography, color palette) will be used as-is for all new screens and components.
- Reusable product suggestion in the item form will be a lightweight inline hint — not a full autocomplete dropdown — to keep the form clean.
