# Feature Specification: AI Shopping List Assistant

**Feature Branch**: `004-ai-list-assistant`
**Created**: 2026-05-15
**Status**: Draft
**Input**: User description: "Permitir que o usuário crie ou complete uma lista de compras com ajuda de IA, usando linguagem natural."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Request AI Suggestions for an Active List (Priority: P1)

As an authenticated shopper with an active list open, I want to describe what I
need using natural language, so the AI can suggest relevant products that I can
review before adding to my list.

**Why this priority**: This is the core value of the feature. Without the
ability to request and receive structured suggestions, the assistant cannot help
the user build their list faster.

**Independent Test**: A signed-in user with an active list can open the AI
assistant, submit a natural language prompt, and receive a list of structured
product suggestions — all without any items being added to the list yet.

**Acceptance Scenarios**:

1. **Given** an active list is open, **When** the user invokes the AI assistant entry point, **Then** an input area appears where the user can type a natural language shopping request.
2. **Given** the user submits a prompt such as "list for a BBQ with 10 people", **When** the system processes it, **Then** a structured list of suggested products with names and quantity hints is displayed for review.
3. **Given** an AI request is in progress, **When** the user waits, **Then** a loading state is shown and the list below is unchanged.
4. **Given** the AI service is unavailable or returns an error, **When** the user submits a prompt, **Then** a clear error message is shown and the list remains unchanged.
5. **Given** the AI returns zero applicable suggestions, **When** the result is displayed, **Then** the user sees a message indicating no relevant items were found and can try a different prompt.

---

### User Story 2 — Review, Select, and Confirm Suggestions (Priority: P1)

As a shopper reviewing AI suggestions, I want to see each suggested item
individually, choose which ones I want, and confirm my selection before anything
is added, so I always control what goes on my list.

**Why this priority**: The confirm-before-add requirement is a core constraint
of the feature. Every item added through this flow must be user-approved.

**Independent Test**: A user can review a set of AI suggestions, deselect
unwanted items, and confirm — resulting in only the selected items appearing on
the list, with no others added automatically.

**Acceptance Scenarios**:

1. **Given** suggestions are displayed, **When** the user reviews them, **Then** each suggestion shows the product name and quantity hint, and all are pre-selected by default.
2. **Given** the user deselects one or more suggestions and confirms, **When** items are added, **Then** only the selected suggestions are added and deselected ones are discarded.
3. **Given** a suggestion matches an item already on the current list, **When** suggestions are displayed, **Then** that suggestion is marked as "already on list" and pre-deselected.
4. **Given** a suggestion matches an existing product in the user's product library, **When** the item is added, **Then** it is linked to that existing product rather than creating a duplicate.
5. **Given** the user cancels or dismisses the suggestion flow, **When** the flow closes, **Then** no items are added and the list is unchanged.
6. **Given** the user confirms with all suggestions deselected, **When** the confirmation is processed, **Then** no items are added and a neutral feedback message is shown.

---

### Edge Cases

- If the AI response includes suggestions with missing or empty product names, those suggestions are filtered out before display.
- If a suggested product name partially matches multiple existing products, the closest match is pre-linked and the user can adjust after adding.
- If the user navigates away during the suggestion review, the flow is cancelled and no items are added.
- If the active list is completed or archived, the AI assistant entry point is not available.
- If connectivity is lost during an AI request, the user is informed and no partial suggestions are shown.
- If the AI returns an unusually large number of suggestions, the list is scrollable and all suggestions are reviewable before confirmation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an AI assistant entry point accessible from the active list detail screen.
- **FR-002**: The system MUST accept a natural language text prompt from the authenticated user describing their shopping needs.
- **FR-003**: The system MUST display a loading indicator while the AI processes the request and MUST NOT modify the list during this time.
- **FR-004**: The system MUST display AI-returned suggestions as a structured reviewable list showing at minimum the product name and quantity hint for each suggestion.
- **FR-005**: The system MUST allow the user to select or deselect individual suggestions before any item is added.
- **FR-006**: The system MUST add items to the active list only after explicit user confirmation.
- **FR-007**: The system MUST NOT add any items to the list without user confirmation, regardless of AI output.
- **FR-008**: The system MUST detect when a suggestion matches an item already on the current list and indicate this to the user with the suggestion pre-deselected.
- **FR-009**: The system MUST attempt to match accepted suggestions to existing products in the user's product library and link to matching products rather than creating duplicates.
- **FR-010**: The system MUST add accepted items to the list through the same ownership and validation rules that apply to manually added items.
- **FR-011**: The system MUST handle AI service errors gracefully by displaying a user-friendly error message and leaving the list unchanged.
- **FR-012**: The system MUST allow the user to dismiss the suggestion flow at any point before confirmation without modifying the list.
- **FR-013**: The system MUST record a structured user event when an AI suggestion request is submitted and for each item added through the confirmation flow.
- **FR-014**: The system MUST keep the AI suggestion flow unavailable for completed or archived lists.
- **FR-015**: The system MUST keep AI service calls behind a replaceable application boundary so the AI provider can be changed without modifying the user-facing flow.

### Key Entities

- **AIPrompt**: The natural language input submitted by the user (ephemeral; never persisted).
- **SuggestedItem**: A temporary structured item returned by the AI containing at minimum a product name and optionally a quantity and unit hint (ephemeral; not persisted as such).
- **ShoppingListItem**: The persisted list item created when the user confirms a suggestion, following all existing domain rules for ownership, quantity, and price.
- **Product**: An existing or newly created reusable product linked to accepted suggestions through the existing product library.
- **UserEvent**: An audit record for AI_SUGGESTION_REQUESTED and each ITEM_ADDED action produced through the AI assistant flow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of users can invoke the AI assistant, submit a prompt, review suggestions, and add items to their list in under 2 minutes during usability testing.
- **SC-002**: The AI returns displayable suggestions within 10 seconds under normal mobile network conditions in 95% of requests.
- **SC-003**: 100% of item additions through the AI flow require explicit user confirmation — zero items are added automatically.
- **SC-004**: 0% of AI interactions result in a duplicate item appearing on the list without the user being informed first.
- **SC-005**: The list remains fully editable through manual flows if the AI service is unavailable, with no degradation to existing functionality.
- **SC-006**: 100% of items added through the AI assistant are scoped to the authenticated user and the correct active list.
- **SC-007**: 100% of AI suggestion requests and each resulting item addition produce the expected user events with correct owner and entity references.

## Scope

### Included

- Natural language prompt input on the active list screen.
- AI-generated structured product suggestions.
- Reviewable suggestion preview with per-item selection controls.
- Duplicate detection against the current list.
- Product library matching for accepted suggestions.
- Loading, error, and empty states.
- User event recording for the suggestion and confirmation steps.
- Graceful degradation when the AI service is unavailable.

### Excluded

- Automatic item addition without user confirmation.
- Price suggestion or retrieval by the AI.
- Barcode scanning or image recognition.
- Dietary preference tracking or allergen filtering.
- Multi-provider AI failover.
- Offline AI operation.
- Suggestion history or saved prompts across sessions.
- Suggestion quality scoring or feedback collection.
- Integration with external supermarket catalogs.

## Assumptions

- Accepted items are added with a quantity derived from the AI suggestion and a zero unit price; the user sets prices manually through the existing item edit flow.
- AI suggestions are ephemeral and are not persisted between sessions or across dismissals.
- The AI request context includes the list name and the names of items already on the list to help reduce irrelevant or duplicate suggestions.
- A single AI service integration is used for this phase; multi-provider routing is outside scope.
- The AI response must include at minimum a product name per suggestion; quantity and unit are optional hints that may be absent.
- Matching suggestions to the user's existing product library is done after suggestions are returned, not during AI processing.
- Items added through the AI flow are subject to the same append-only price history and user event rules as manually added items once prices are set.
- The feature targets authenticated users only; the assistant is not available to unauthenticated sessions.
