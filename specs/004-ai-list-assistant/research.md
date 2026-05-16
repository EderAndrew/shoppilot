# Research: AI Shopping List Assistant

**Feature**: 004-ai-list-assistant
**Date**: 2026-05-15
**Method**: Live codebase audit + architectural analysis

---

## Decision 1: AI integration pattern — where does the API call live?

**Decision**: Route all AI requests through a Supabase Edge Function (`supabase/functions/suggest-items/`). The mobile app calls the Edge Function via `supabase.functions.invoke()`; the Edge Function holds the AI provider API key and calls the AI provider's API.

**Rationale**: Mobile bundles are inspectable. Putting an AI provider API key directly in the Expo app would expose it to extraction. A Supabase Edge Function acts as a lightweight, authenticated server-side proxy without requiring a full backend. The JWT from the authenticated Supabase session is forwarded as the Bearer token; the Edge Function validates it with `supabase.auth.getUser()` before processing any request. This fits the project's existing infrastructure pattern (`apps/mobile/src/infrastructure/` → Supabase → external services).

**Alternatives considered**:
- Direct mobile → AI provider API call → rejected; exposes API key in the mobile bundle, violates OWASP Principle V.
- Expo API Routes (server-side) → rejected; the project is purely a mobile Expo app without a server-side rendering target; adding Expo API routes changes the deployment model unnecessarily.
- Bundling a local model (on-device) → rejected; out of scope for Phase 1, adds APK size and requires hardware capability checks.

---

## Decision 2: AI provider and model selection

**Decision**: Use the Anthropic Claude API as the initial provider, targeting a fast inference model optimized for structured JSON output. The `AIRepository` port abstracts the provider so a different model or vendor (OpenAI, Gemini, self-hosted) can be swapped without changing any application or domain code.

**Rationale**: The project's `packages/config/` and environment configuration already follow a strict env-var contract. Adding `ANTHROPIC_API_KEY` as a Supabase Edge Function secret (not in the mobile `.env`) keeps the mobile app's environment surface unchanged. Provider-specific logic is confined to the Edge Function and `SupabaseAIRepository`.

**Provider independence strategy**:
- `AIRepository` port defines `suggestItems(prompt, context)` returning `SuggestedItem[]`
- The Edge Function is the only file that references Anthropic's SDK/API
- Swapping providers requires only: a new Edge Function implementation + no application or UI changes

**Alternatives considered**:
- OpenAI GPT-4o-mini → viable alternative; can be substituted at the Edge Function layer without any architecture change
- Self-hosted Ollama → possible future phase; the port abstraction already supports it

---

## Decision 3: SuggestedItem shape and validation

**Decision**: Define `SuggestedItem` as a plain TypeScript interface (not a domain class with methods) with required `name` (string), required `quantity` (number ≥ 1), and optional `unit` (string). The AI is instructed to always return `quantity ≥ 1`. AI responses are validated with a Zod schema before any item is shown to the user. Items that fail validation are silently filtered out.

**Rationale**: `SuggestedItem` is ephemeral — it is never persisted. It does not need domain behavior (no total calculation, no ownership). Making it a plain interface avoids the overhead of domain class instantiation. Zod validation at the infrastructure boundary prevents malformed AI responses from propagating to the UI layer.

**AI response JSON schema** (used in Edge Function):
```json
{
  "suggestions": [
    { "name": "string (required)", "quantity": "number (required, ≥1)", "unit": "string (optional)" }
  ]
}
```

**Zod schema** (in `features/ai-assistant/aiAssistant.schemas.ts`):
```ts
z.object({
  suggestions: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().int().min(1),
      unit: z.string().optional()
    })
  ).min(0)
})
```

---

## Decision 4: Duplicate detection strategy

**Decision**: Two-level duplicate detection, both done client-side after suggestions are received:

1. **Against current list items**: normalize both names to lowercase, trimmed. If a suggested name matches an existing item name exactly, mark that suggestion as `status: "already_on_list"` and pre-deselect it.
2. **Against product library**: run a debounced `SearchProducts.execute()` for each accepted suggestion name at confirmation time. If a match is found, link to the existing product; otherwise, create a new product inline before adding the item.

**Rationale**: Checking for exact-match duplicates at suggestion display time requires only in-memory normalization against the already-fetched list detail (which is in TanStack Query cache). Full product library fuzzy matching during suggestion display would require N search queries, adding latency and re-render pressure. Deferring product library matching to confirmation time (when the user has already selected) reduces unnecessary queries.

**Alternatives considered**:
- Server-side duplicate detection in the Edge Function → rejected; the Edge Function doesn't have access to the user's current list items (would need to query Supabase inside the function, adding latency and coupling)
- Fuzzy matching during suggestion display → rejected; too many queries, degrades perceived performance

---

## Decision 5: State management for suggestions

**Decision**: Suggestions are stored in local React component state within `AISuggestionSheet` (not in TanStack Query, not in Zustand). The AI request itself is wrapped in a TanStack Query `useMutation` for consistent loading/error/idle state tracking.

**Rationale**: Suggestions are ephemeral UI state — they exist only during the modal session and are discarded on close. TanStack Query is for server state that should be cached and shared across the component tree; Zustand is for transient UI flags (which `isAIAssistantOpen` is). Suggestion data itself is too short-lived to warrant either. `useState` is the right tool.

**State layout**:
```
Zustand uiStore:       isAIAssistantOpen: boolean     (controls sheet visibility)
useMutation:           status, data, error            (AI request lifecycle)
AISuggestionSheet:     selectedIds: Set<string>       (which suggestions are checked)
```

**Alternatives considered**:
- Store suggestions in Zustand → rejected; suggestions don't need global access, and Zustand would need clearing on every modal close
- useQuery with manual refetch → rejected; AI generation is not a background refresh; it's a user-triggered action

---

## Decision 6: Item confirmation and addition flow

**Decision**: When the user confirms selected suggestions, add them sequentially using the existing `AddShoppingListItem` use case for each item. Each addition: (a) searches the product library for a name match; (b) creates the product if not found; (c) adds the item with `quantity` from the suggestion and `unitPrice = 0`. The user sets prices individually via the existing item edit flow. Invalidate `queryKeys.shoppingLists.detail(listId)` once after all items are added.

**Rationale**: Reusing `AddShoppingListItem` ensures that price history recording, user event logging, and budget summary recalculation all happen exactly as they do for manually added items. Zero-price addition is consistent with the spec assumption that "users set prices manually." A single cache invalidation at the end avoids N re-renders during sequential adds.

**Addition sequence pseudocode**:
```
for each selectedSuggestion:
  product = await searchProducts(suggestion.name, limit=1)
  if product found and name matches closely:
    productId = product.id
  else:
    productId = (await createProduct({ name: suggestion.name, unit: suggestion.unit })).id
  await addShoppingListItem({ listId, productId, quantity: suggestion.quantity, unitPrice: 0 })
invalidateQueries(queryKeys.shoppingLists.detail(listId))
```

**Alternatives considered**:
- Batch insert (single DB call for all items) → rejected; would bypass `AddShoppingListItem` use case, price history recording, and user event logging
- Optimistic update before confirmation → rejected; adds complexity without clear UX benefit; the user has already seen the suggestions

---

## Decision 7: UI entry point placement

**Decision**: Add a secondary "IA" or sparkle icon button to the list detail screen header, positioned alongside the existing `+ Item` button. Tapping it opens `AISuggestionSheet` as a bottom sheet modal. The original `+ Item` button and its flow are unchanged.

**Rationale**: The header already has space for small action buttons (currently: "Comparativo", "Completo", "Item" in an XStack). Adding a fourth icon-only button keeps the visual footprint small. A bottom sheet is the native mobile pattern for a modal interaction that doesn't require a new screen.

**Alternatives considered**:
- FAB (Floating Action Button) → rejected; the app has no existing FAB pattern; would require design system decisions
- New tab or screen → rejected; AI assistant is contextual to an active list, not a top-level destination
- Long-press on existing "+ Item" → rejected; non-discoverable, doesn't match the app's interaction language

---

## NEEDS CLARIFICATION Resolution

No `[NEEDS CLARIFICATION]` markers existed in the spec. All decisions above were made as part of research and are recorded here.
