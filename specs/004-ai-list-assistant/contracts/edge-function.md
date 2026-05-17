# Contract: suggest-items Edge Function

**Feature**: 004-ai-list-assistant
**Date**: 2026-05-15

---

## Endpoint

```
POST /functions/v1/suggest-items
Authorization: Bearer <supabase-session-jwt>
Content-Type: application/json
```

Deployed to the project's Supabase instance. Invoked via `supabase.functions.invoke("suggest-items", ...)` from `SupabaseAIRepository`.

---

## Request Body

```json
{
  "prompt": "lista para churrasco com 10 pessoas",
  "context": {
    "listName": "Compras de Maio",
    "existingItemNames": ["Arroz", "Feijão"]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | `string` | yes | Natural language shopping request from user (max 500 chars) |
| `context.listName` | `string` | yes | Name of the active shopping list |
| `context.existingItemNames` | `string[]` | yes | Names of items already on the list (for deduplication hint) |

---

## Success Response — 200 OK

```json
{
  "suggestions": [
    { "name": "Carvão", "quantity": 3, "unit": "kg" },
    { "name": "Carne Bovina", "quantity": 5, "unit": "kg" },
    { "name": "Pão de Alho", "quantity": 4 },
    { "name": "Refrigerante", "quantity": 10, "unit": "L" },
    { "name": "Guardanapo", "quantity": 2 }
  ]
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `suggestions` | `array` | 0–20 items |
| `suggestions[].name` | `string` | min 1 char, max 200 chars |
| `suggestions[].quantity` | `integer` | min 1, max 999 |
| `suggestions[].unit` | `string?` | optional, max 50 chars |

Empty suggestions array `{ "suggestions": [] }` is a valid response when the AI finds no applicable items.

---

## Error Responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "error": "invalid_request" }` | Missing required fields or malformed JSON |
| 401 | `{ "error": "unauthorized" }` | Missing, expired, or invalid JWT |
| 422 | `{ "error": "unprocessable_response" }` | AI provider returned output that couldn't be parsed into the expected schema |
| 503 | `{ "error": "ai_service_unavailable" }` | AI provider timeout or error |

---

## Authentication Contract

The Edge Function MUST:
1. Extract the Bearer token from the `Authorization` header
2. Call `supabase.auth.getUser(token)` using the service client
3. Reject with `401` if the token is missing, malformed, or refers to a non-existent user
4. Never call the AI provider for unauthenticated requests

The mobile client MUST:
1. Pass the current Supabase session JWT as the Bearer token
2. Treat a `401` response as a session expiration and redirect to login

---

## AI Prompt Engineering Contract

The Edge Function constructs the AI prompt using the request fields. The prompt MUST:
- Include the user's natural language input
- Include the list name as context
- Include existing item names to discourage duplicates
- Instruct the AI to return a valid JSON object matching the response schema
- Instruct the AI to suggest realistic grocery quantities for a Brazilian supermarket context
- NOT include any user personally identifiable information beyond the list name and item names

The exact prompt template is an internal Edge Function implementation detail and is not part of this contract.

---

## Environment Variables

The Edge Function requires the following Supabase secret (set via `supabase secrets set`):

| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | API key for the AI provider (Anthropic Claude) |

This secret is NEVER exposed to the mobile client.
