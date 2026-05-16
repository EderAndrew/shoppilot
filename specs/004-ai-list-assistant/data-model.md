# Data Model: AI Shopping List Assistant

**Feature**: 004-ai-list-assistant
**Date**: 2026-05-15

---

## New Domain Types (no schema migrations required)

### SuggestedItem

**Location**: `apps/mobile/src/domain/entities/AISuggestion.ts`

```ts
// Ephemeral — never persisted. Exists only during the suggestion review flow.
export interface SuggestedItem {
  id: string;          // client-generated uuid for selection tracking
  name: string;        // normalized product name from AI response
  quantity: number;    // suggested quantity (integer ≥ 1)
  unit?: string;       // optional unit hint ("kg", "un", "L", etc.)
  status: "pending" | "already_on_list";
  // "already_on_list" = name matches an existing item on the current list
}

export interface AIPromptContext {
  listName: string;
  existingItemNames: string[];  // for duplicate-avoidance in the prompt
}
```

**Transition lifecycle**:
```
AI response JSON
  → validated by Zod schema
  → normalized to SuggestedItem[]
  → each item checked against existingItemNames → status set
  → displayed for user review
  → confirmed subset → fed to AddShoppingListItem use case
  → discarded (never saved as SuggestedItem)
```

---

## No Database Schema Changes

This feature requires **no Supabase migrations**. All new data is:
- `ShoppingListItem` rows (created via existing `AddShoppingListItem` use case)
- `PriceHistory` rows (created automatically by `AddShoppingListItem`, with price = 0)
- `UserEvent` rows (created automatically by `AddShoppingListItem`, type ITEM_ADDED)
- `Product` rows (created via existing `CreateProduct` use case, when no match found)

---

## New Application Port

### AIRepository

**Location**: `apps/mobile/src/application/ports/AIRepository.ts`

```ts
export interface AIRepository {
  suggestItems(
    prompt: string,
    context: AIPromptContext
  ): Promise<SuggestedItem[]>;
}
```

The port is intentionally minimal. The Edge Function handles prompt engineering, AI provider selection, and response normalization. The port's single method returns already-normalized, already-validated suggestions.

---

## New Application Use Case

### SuggestShoppingListItems

**Location**: `apps/mobile/src/application/use-cases/aiSuggestions.ts`

```ts
interface Input {
  prompt: string;
  listId: string;
  listName: string;
  existingItems: ShoppingListItem[];
}

interface Output {
  suggestions: SuggestedItem[];
}

class SuggestShoppingListItems {
  constructor(private readonly ai: AIRepository) {}

  async execute(input: Input): Promise<Output> {
    const existingItemNames = input.existingItems.map(
      (item) => item.product.name
    );
    const context: AIPromptContext = {
      listName: input.listName,
      existingItemNames,
    };
    const raw = await this.ai.suggestItems(input.prompt, context);
    const suggestions = raw.map((s) => ({
      ...s,
      status: existingItemNames.some(
        (n) => n.toLowerCase().trim() === s.name.toLowerCase().trim()
      ) ? "already_on_list" as const : "pending" as const,
    }));
    return { suggestions };
  }
}
```

---

## New Infrastructure Adapter

### SupabaseAIRepository

**Location**: `apps/mobile/src/infrastructure/repositories/SupabaseAIRepository.ts`

```ts
// Calls supabase.functions.invoke("suggest-items", { body: { prompt, context } })
// Validates response with Zod schema
// Returns SuggestedItem[] with client-generated IDs
// Throws typed AIServiceError on:
//   - HTTP non-2xx from Edge Function
//   - Zod validation failure
//   - Network timeout (handled by Expo fetch abort signal)
```

**Registration**: Added to `defaultRepositories.ts` under key `ai`.

---

## New Edge Function

### suggest-items

**Location**: `supabase/functions/suggest-items/index.ts`

**Request** (POST, authenticated):
```ts
{
  prompt: string;              // user's natural language input
  context: {
    listName: string;
    existingItemNames: string[];
  };
}
```

**Response** (200 OK):
```ts
{
  suggestions: Array<{
    name: string;              // normalized product name
    quantity: number;          // integer ≥ 1
    unit?: string;             // optional unit
  }>;
}
```

**Error responses**:
- `401` — missing or invalid JWT
- `400` — invalid request body
- `422` — AI provider returned unparseable response
- `503` — AI provider unavailable

**Authentication**: Edge Function extracts Bearer token from `Authorization` header, calls `supabase.auth.getUser(token)` to validate. Rejects unauthenticated requests before calling the AI provider.

---

## New Zod Schema

**Location**: `apps/mobile/src/features/ai-assistant/aiAssistant.schemas.ts`

```ts
export const suggestedItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(999),
  unit: z.string().max(50).optional(),
});

export const aiSuggestionsResponseSchema = z.object({
  suggestions: z.array(suggestedItemSchema),
});
```

Used in `SupabaseAIRepository` to validate the Edge Function response before constructing `SuggestedItem[]`.

---

## TanStack Query Keys (no new keys required)

The AI suggestion flow uses `useMutation`, not `useQuery`. No new query keys are needed. Existing invalidation (`queryKeys.shoppingLists.detail(listId)`) is called once after all confirmed items are added.

---

## Zustand UI Store Changes

**Location**: `apps/mobile/src/shared/state/uiStore.ts`

**Added fields**:
```ts
isAIAssistantOpen: boolean;
setAIAssistantOpen: (open: boolean) => void;
```

`isAIAssistantOpen` is cleared by the existing `resetTransientUi()` action — no additional cleanup needed.
