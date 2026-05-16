# Tasks: AI Shopping List Assistant

**Feature**: 004-ai-list-assistant | **Date**: 2026-05-15 | **Plan**: [plan.md](./plan.md)
**Spec**: [spec.md](./spec.md) | **Data Model**: [data-model.md](./data-model.md)

---

## User Stories (from spec.md)

- **US1** (P1) — Request AI Suggestions for an Active List
- **US2** (P1) — Review, Select, and Confirm Suggestions

Both stories are P1 and tightly coupled — US1 produces the suggestions that US2 consumes.
US2 cannot be tested independently until US1 is complete.

---

## Dependency Graph

```
Phase 1 (Auditoria — COMPLETE)
  → Phase 2 (Foundation: domain types, schema, port, use case, Edge Function)
    → Phase 3 (Infrastructure: SupabaseAIRepository, uiStore, mutation hook)
      → Phase 4 (US1 UI: AISuggestionSheet prompt + loading + error + empty)
        → Phase 5 (US2 UI: SuggestionItemRow + selection + duplicate display)
          → Phase 6 (US2 Confirmation: useConfirmSuggestions + product lookup)
            → Phase 7 (Integration: list screen wiring)
              → Phase 8 (Robustez)
                → Phase 9 (UX & Acessibilidade)
                  → Phase 10 (Qualidade & Validação Final)
```

**Parallel opportunities within phases**:
- Phase 2: T003 + T004 can run in parallel (different files, no dependency)
- Phase 2: T007 + T008 can start after T005 is underway (Edge Function has no dependency on domain types)
- Phase 4: T017 (sheet prompt view) and T018 (SuggestionItemRow) can run in parallel

---

## Phase 1 — Auditoria (COMPLETE)

*Audit completed as part of planning. Findings in `research.md` and `data-model.md`.*

- [x] T001 Audit current item addition flow, `AddShoppingListItem` use case, and `ShoppingListItemForm` in `apps/mobile/src/`
- [x] T002 Audit `ProductPicker`, `SearchProducts` use case, `uiStore`, TanStack Query key patterns, and existing modal/sheet patterns

---

## Phase 2 — Foundation: Domain, Schema, Port, Use Case, Edge Function

*No story label — these are blocking prerequisites for both US1 and US2.*

### 2A — Domain & Application Layer

- [x] T003 [P] Create `SuggestedItem` interface and `AIPromptContext` type in `apps/mobile/src/domain/entities/AISuggestion.ts`

  **Objetivo**: Definir o contrato de domínio para sugestões da IA — tipos TypeScript puros, sem dependências externas.

  **Descrição técnica**:
  ```ts
  // apps/mobile/src/domain/entities/AISuggestion.ts
  export interface SuggestedItem {
    id: string;          // client-generated uuid, for selection tracking only
    name: string;        // normalized product name
    quantity: number;    // integer ≥ 1
    unit?: string;       // optional ("kg", "un", "L")
    category?: string;   // optional display hint from AI ("Carnes", "Bebidas")
    notes?: string;      // optional preparation/observation hint from AI
    status: "pending" | "already_on_list";
  }

  export interface AIPromptContext {
    listName: string;
    existingItemNames: string[];
  }
  ```

  **Arquivos afetados**: `apps/mobile/src/domain/entities/AISuggestion.ts` (NEW)

  **Dependências**: T001, T002 (audit complete)

  **Critério de pronto**: `pnpm typecheck` passa; o arquivo exporta ambos os tipos sem erros.

  **Risco**: Baixo — TypeScript puro, sem I/O.

  **Validação**: `pnpm typecheck` no workspace.

---

- [x] T004 [P] Create `AIRepository` port interface in `apps/mobile/src/application/ports/AIRepository.ts`

  **Objetivo**: Definir a interface de abstração para o provider de IA — permite trocar Anthropic por qualquer outro provider sem tocar em código de UI ou use cases.

  **Descrição técnica**:
  ```ts
  // apps/mobile/src/application/ports/AIRepository.ts
  import { SuggestedItem, AIPromptContext } from "../../domain/entities/AISuggestion";

  export interface AIRepository {
    suggestItems(
      prompt: string,
      context: AIPromptContext
    ): Promise<SuggestedItem[]>;
  }
  ```

  **Arquivos afetados**: `apps/mobile/src/application/ports/AIRepository.ts` (NEW)

  **Dependências**: T003

  **Critério de pronto**: `pnpm typecheck` passa; interface exportada corretamente.

  **Risco**: Baixo — interface pura, sem implementação.

  **Validação**: `pnpm typecheck` no workspace.

---

- [x] T005 Create Zod validation schema for AI response in `apps/mobile/src/features/ai-assistant/aiAssistant.schemas.ts`

  **Objetivo**: Garantir que qualquer resposta da IA passe por validação Zod antes de ser exibida ao usuário — respostas malformadas são descartadas antes de propagar para a UI.

  **Descrição técnica**:
  ```ts
  // apps/mobile/src/features/ai-assistant/aiAssistant.schemas.ts
  import { z } from "zod";

  export const suggestedItemSchema = z.object({
    name: z.string().min(1).max(200),
    quantity: z.number().int().min(1).max(999).default(1),
    unit: z.string().max(50).optional(),
    category: z.string().max(100).optional(),
    notes: z.string().max(300).optional(),
  });

  export const aiSuggestionsResponseSchema = z.object({
    suggestions: z.array(suggestedItemSchema).max(20),
  });

  export type AISuggestionsResponse = z.infer<typeof aiSuggestionsResponseSchema>;
  ```

  **Normalização de itens inválidos**: Itens com `name` vazio ou `quantity < 1` são rejeitados pela validação Zod. Itens com campos extras desconhecidos são ignorados via `z.object()` (Zod descarta campos extras por padrão).

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/aiAssistant.schemas.ts` (NEW)

  **Dependências**: T003

  **Critério de pronto**: Schema exportado; valida resposta válida; rejeita `name: ""` e `quantity: 0`; `pnpm typecheck` passa.

  **Risco**: Baixo.

  **Validação**: Adicionar um teste unitário rápido com entrada válida e inválida.

---

- [x] T006 Create `SuggestShoppingListItems` use case in `apps/mobile/src/application/use-cases/aiSuggestions.ts`

  **Objetivo**: Implementar o use case de domínio que orquestra a chamada ao provider de IA e anota as sugestões com status de duplicata — sem I/O direto, testável com mock.

  **Descrição técnica**:
  ```ts
  // apps/mobile/src/application/use-cases/aiSuggestions.ts
  import { v4 as uuid } from "uuid"; // or crypto.randomUUID()
  import { AIRepository } from "../ports/AIRepository";
  import { SuggestedItem, AIPromptContext } from "../../domain/entities/AISuggestion";

  interface Input {
    prompt: string;
    listId: string;
    listName: string;
    existingItemNames: string[];   // names from current list items (normalized externally)
  }

  interface Output {
    suggestions: SuggestedItem[];
  }

  export class SuggestShoppingListItems {
    constructor(private readonly ai: AIRepository) {}

    async execute(input: Input): Promise<Output> {
      const context: AIPromptContext = {
        listName: input.listName,
        existingItemNames: input.existingItemNames,
      };
      const raw = await this.ai.suggestItems(input.prompt, context);

      const normalizedExisting = input.existingItemNames.map((n) =>
        n.toLowerCase().trim()
      );

      const suggestions = raw.map((s) => ({
        ...s,
        id: typeof crypto !== "undefined" ? crypto.randomUUID() : uuid(),
        status: normalizedExisting.includes(s.name.toLowerCase().trim())
          ? ("already_on_list" as const)
          : ("pending" as const),
      }));

      return { suggestions };
    }
  }
  ```

  **Arquivos afetados**: `apps/mobile/src/application/use-cases/aiSuggestions.ts` (NEW)

  **Dependências**: T003, T004

  **Critério de pronto**: Use case exportado; lógica de status `already_on_list` funciona com comparação case-insensitive + trim; `pnpm typecheck` passa.

  **Risco**: Baixo — sem I/O externo neste arquivo.

  **Validação**: Teste unitário (ver T043).

---

### 2B — Edge Function (AI Server)

- [x] T007 Create Supabase Edge Function file structure in `supabase/functions/suggest-items/index.ts`

  **Objetivo**: Criar o endpoint server-side que recebe o prompt do app mobile, valida o JWT, e chama o provider de IA — mantendo a API key fora do bundle do app.

  **Descrição técnica** — estrutura inicial com autenticação:
  ```ts
  // supabase/functions/suggest-items/index.ts
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // 1. Auth validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse + validate body (prompt, context)
    // 3. Call AI provider
    // 4. Return { suggestions: [...] }
    // (steps 3-4 implemented in T008)
    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  });
  ```

  **Arquivos afetados**: `supabase/functions/suggest-items/index.ts` (NEW)

  **Dependências**: T001 (audit of existing Supabase patterns)

  **Critério de pronto**: Arquivo criado; `supabase functions serve suggest-items` sobe sem erros; requisição sem JWT retorna 401; requisição com JWT válido retorna `{ suggestions: [] }`.

  **Risco**: Médio — primeiro Edge Function do projeto; testar localmente com `supabase start` antes de avançar.

  **Validação**: `curl -X POST http://localhost:54321/functions/v1/suggest-items` com e sem JWT; verificar 401 vs 200.

---

- [x] T008 Implement AI provider call inside the Edge Function in `supabase/functions/suggest-items/index.ts`

  **Objetivo**: Completar o Edge Function com a chamada ao provider de IA (Anthropic), prompt engineering, e mapeamento de resposta para o schema esperado.

  **Descrição técnica** — adicionar ao corpo da função após a autenticação:
  ```ts
  // Após validação de auth:
  const body = await req.json();
  const { prompt, context } = body;

  if (!prompt || typeof prompt !== "string" || prompt.length > 500) {
    return new Response(JSON.stringify({ error: "invalid_request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

  const systemPrompt = `Você é um assistente de compras para supermercados brasileiros.
O usuário está montando uma lista chamada "${context?.listName ?? "Lista"}".
Itens já na lista: ${context?.existingItemNames?.join(", ") || "nenhum"}.
Responda APENAS com um objeto JSON válido seguindo EXATAMENTE este schema:
{"suggestions":[{"name":"string","quantity":integer,"unit":"string opcional","category":"string opcional","notes":"string opcional"}]}
Sugira 5 a 15 itens relevantes. Não repita itens já presentes na lista.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "ai_service_unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiResponse = await response.json();
  const text = aiResponse.content?.[0]?.text ?? "{}";
  let parsed: { suggestions: unknown[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    return new Response(JSON.stringify({ error: "unprocessable_response" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(parsed), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  ```

  **Segredo necessário**: `supabase secrets set ANTHROPIC_API_KEY=<key>`

  **Arquivos afetados**: `supabase/functions/suggest-items/index.ts` (MODIFY)

  **Dependências**: T007

  **Critério de pronto**: Requisição autenticada com prompt "frango" retorna JSON com `suggestions` contendo ao menos 3 itens relevantes; prompt de 600 chars retorna 400; AI fora do ar retorna 503.

  **Risco**: Alto — requer API key real e deploy. Testar localmente primeiro.

  **Validação**: `curl` com JWT real apontando para `http://localhost:54321/functions/v1/suggest-items` com body `{"prompt":"churrasco para 10 pessoas","context":{"listName":"Compras","existingItemNames":[]}}`.

---

## Phase 3 — Infrastructure: SupabaseAIRepository, uiStore, Mutation Hook

- [x] T009 Create `AIServiceError` class and `SupabaseAIRepository` in `apps/mobile/src/infrastructure/repositories/SupabaseAIRepository.ts`

  **Objetivo**: Implementar o adapter de infraestrutura que chama a Edge Function via `supabase.functions.invoke`, valida a resposta com Zod, e converte para `SuggestedItem[]`. Toda lógica específica do Supabase/Anthropic fica confinada aqui.

  **Descrição técnica**:
  ```ts
  // apps/mobile/src/infrastructure/repositories/SupabaseAIRepository.ts
  import { SupabaseClient } from "@supabase/supabase-js";
  import { AIRepository } from "../../application/ports/AIRepository";
  import { SuggestedItem, AIPromptContext } from "../../domain/entities/AISuggestion";
  import { aiSuggestionsResponseSchema } from "../../features/ai-assistant/aiAssistant.schemas";

  export class AIServiceError extends Error {
    constructor(
      message: string,
      public readonly code: "unavailable" | "invalid_response" | "unauthorized"
    ) {
      super(message);
      this.name = "AIServiceError";
    }
  }

  export class SupabaseAIRepository implements AIRepository {
    constructor(private readonly supabase: SupabaseClient) {}

    async suggestItems(
      prompt: string,
      context: AIPromptContext
    ): Promise<SuggestedItem[]> {
      const { data, error } = await this.supabase.functions.invoke(
        "suggest-items",
        { body: { prompt, context } }
      );

      if (error) {
        if (error.message?.includes("401")) throw new AIServiceError(error.message, "unauthorized");
        throw new AIServiceError(error.message ?? "AI service unavailable", "unavailable");
      }

      let parsed: ReturnType<typeof aiSuggestionsResponseSchema.parse>;
      try {
        parsed = aiSuggestionsResponseSchema.parse(data);
      } catch {
        throw new AIServiceError("Invalid AI response schema", "invalid_response");
      }

      return parsed.suggestions.map((s) => ({
        id: crypto.randomUUID(),
        name: s.name,
        quantity: s.quantity,
        unit: s.unit,
        category: s.category,
        notes: s.notes,
        status: "pending" as const,
      }));
    }
  }
  ```

  **Arquivos afetados**:
  - `apps/mobile/src/infrastructure/repositories/SupabaseAIRepository.ts` (NEW)

  **Dependências**: T004 (AIRepository port), T005 (Zod schema), T008 (Edge Function live)

  **Critério de pronto**: `SupabaseAIRepository` implementa `AIRepository`; Zod falha gera `AIServiceError("invalid_response")`; `pnpm typecheck` passa.

  **Risco**: Médio — depende da Edge Function estar deployada.

  **Validação**: Teste unitário com `supabase.functions.invoke` mockado (ver T044).

---

- [x] T010 Register `SupabaseAIRepository` in `apps/mobile/src/infrastructure/defaultRepositories.ts`

  **Objetivo**: Adicionar `ai` ao container de repositórios para que o use case `SuggestShoppingListItems` receba a implementação correta via injeção.

  **Descrição técnica**: Importar `SupabaseAIRepository` e adicionar ao container existente:
  ```ts
  // Em defaultRepositories.ts — adicionar à função createRepositoryContainer
  ai: new SupabaseAIRepository(supabaseClient),
  ```
  Também atualizar o tipo do container para incluir `ai: AIRepository`.

  **Arquivos afetados**: `apps/mobile/src/infrastructure/defaultRepositories.ts` (MODIFY)

  **Dependências**: T009

  **Critério de pronto**: `defaultRepositories.ai` existe e é instância de `SupabaseAIRepository`; `pnpm typecheck` passa; nenhum repositório existente é afetado.

  **Risco**: Baixo — mudança aditiva.

  **Validação**: `pnpm typecheck`; verificar que nenhum teste existente quebra com `pnpm --filter mobile test`.

---

- [x] T011 Add `isAIAssistantOpen` and `setAIAssistantOpen` to `apps/mobile/src/shared/state/uiStore.ts`

  **Objetivo**: Adicionar os campos de UI ao store Zustand para controlar visibilidade do sheet do assistente — seguindo o padrão `isCreateListOpen`/`setCreateListOpen` já existente.

  **Descrição técnica**:
  ```ts
  // Adicionar ao tipo UiStoreState:
  isAIAssistantOpen: boolean;
  setAIAssistantOpen: (open: boolean) => void;

  // Adicionar ao initialState:
  isAIAssistantOpen: false,

  // Adicionar à ação:
  setAIAssistantOpen: (open) => set({ isAIAssistantOpen: open }),

  // Garantir que resetTransientUi() inclua:
  isAIAssistantOpen: false,
  ```

  **Arquivos afetados**: `apps/mobile/src/shared/state/uiStore.ts` (MODIFY)

  **Dependências**: T002 (audit uiStore patterns)

  **Critério de pronto**: `useUiStore().isAIAssistantOpen` e `setAIAssistantOpen` disponíveis; `resetTransientUi()` reseta para `false`; `pnpm typecheck` passa.

  **Risco**: Baixo — mudança aditiva ao store existente.

  **Validação**: `pnpm typecheck`; verificar que fluxos existentes não são afetados.

---

- [x] T012 Create `useAISuggestMutation` hook in `apps/mobile/src/features/ai-assistant/useAISuggestMutation.ts`

  **Objetivo**: Encapsular o `SuggestShoppingListItems` use case em um TanStack Query `useMutation` — expondo `status`, `data`, `error`, `mutate`, e `reset` para a UI, sem que a UI acesse o repositório diretamente.

  **Descrição técnica**:
  ```ts
  // apps/mobile/src/features/ai-assistant/useAISuggestMutation.ts
  import { useMutation } from "@tanstack/react-query";
  import { defaultRepositories } from "../../infrastructure/defaultRepositories";
  import { SuggestShoppingListItems } from "../../application/use-cases/aiSuggestions";

  const suggestUseCase = new SuggestShoppingListItems(defaultRepositories.ai);

  interface Input {
    prompt: string;
    listId: string;
    listName: string;
    existingItemNames: string[];
  }

  export function useAISuggestMutation() {
    return useMutation({
      mutationFn: (input: Input) => suggestUseCase.execute(input),
    });
  }
  ```

  **Retorno do hook**: `{ mutate, status, data, error, reset }` — padrão TanStack Query.

  - `status === "idle"` → nenhuma requisição feita
  - `status === "pending"` → aguardando Edge Function
  - `status === "success"` → `data.suggestions` disponível
  - `status === "error"` → `error` é `AIServiceError` ou erro de rede

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/useAISuggestMutation.ts` (NEW)

  **Dependências**: T006 (use case), T009 (infrastructure), T010 (registered)

  **Critério de pronto**: Hook retorna os estados corretos; `pnpm typecheck` passa; uso do hook não causa re-renderizações extras além das mudanças de status.

  **Risco**: Baixo.

  **Validação**: Renderizar o hook em um componente de teste manual; verificar transições de estado.

---

## Phase 4 — US1: UI do Assistente (input, loading, error, vazio)

- [ ] T013 [P] Create `SuggestionItemRow` component in `apps/mobile/src/features/ai-assistant/SuggestionItemRow.tsx`

  **Objetivo**: Criar o componente de linha de sugestão com checkbox, nome, quantidade/unidade e badge "já na lista" — isolado para poder ser testado independentemente da sheet.

  **Descrição técnica**:
  ```tsx
  // apps/mobile/src/features/ai-assistant/SuggestionItemRow.tsx
  import React from "react";
  import { XStack, YStack, Checkbox, Text } from "tamagui";
  import { SuggestedItem } from "../../domain/entities/AISuggestion";

  interface Props {
    suggestion: SuggestedItem;
    isSelected: boolean;
    onToggle: (id: string) => void;
  }

  export const SuggestionItemRow = React.memo(({ suggestion, isSelected, onToggle }: Props) => (
    <XStack
      alignItems="center"
      gap="$3"
      paddingVertical="$2"
      paddingHorizontal="$3"
      onPress={() => onToggle(suggestion.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${suggestion.name}, ${suggestion.quantity}${suggestion.unit ? " " + suggestion.unit : ""}`}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(suggestion.id)}
        size="$4"
      >
        <Checkbox.Indicator>
          <Text>✓</Text>
        </Checkbox.Indicator>
      </Checkbox>
      <YStack flex={1}>
        <XStack alignItems="center" gap="$2">
          <Text
            fontSize="$4"
            color={suggestion.status === "already_on_list" ? "$colorSubtle" : "$color"}
          >
            {suggestion.name}
          </Text>
          {suggestion.status === "already_on_list" && (
            <Text fontSize="$2" color="$colorSubtle" fontStyle="italic">
              já na lista
            </Text>
          )}
        </XStack>
        <Text fontSize="$3" color="$colorSubtle">
          {suggestion.quantity}{suggestion.unit ? ` ${suggestion.unit}` : ""}
          {suggestion.category ? ` · ${suggestion.category}` : ""}
        </Text>
        {suggestion.notes ? (
          <Text fontSize="$2" color="$colorSubtle" fontStyle="italic">
            {suggestion.notes}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  ));
  SuggestionItemRow.displayName = "SuggestionItemRow";
  ```

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/SuggestionItemRow.tsx` (NEW)

  **Dependências**: T003 (SuggestedItem type)

  **Critério de pronto**: Componente renderiza corretamente para `status: "pending"` e `"already_on_list"`; badge "já na lista" visível e muted; checkbox togglea ao pressionar a linha ou o checkbox; `pnpm typecheck` passa.

  **Risco**: Baixo — componente puro com props bem definidas.

  **Validação**: Renderizar com dados mockados; verificar comportamento do checkbox.

---

- [ ] T014 [US1] Create `AISuggestionSheet` component with prompt view in `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx`

  **Objetivo**: Criar o bottom sheet principal com a view de input (estado idle/prompt), usando Tamagui `Sheet`. Esta task cobre apenas o estado inicial — outros estados são adicionados em T015 e T016.

  **Descrição técnica**:
  ```tsx
  // apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx
  import React, { useRef } from "react";
  import { Sheet, YStack, XStack, TextArea, Button, Text, Spinner } from "tamagui";
  import { useUiStore } from "../../shared/state/uiStore";
  import { useAISuggestMutation } from "./useAISuggestMutation";
  import { SuggestedItem } from "../../domain/entities/AISuggestion";

  interface Props {
    listId: string;
    listName: string;
    existingItemNames: string[];
  }

  export function AISuggestionSheet({ listId, listName, existingItemNames }: Props) {
    const { isAIAssistantOpen, setAIAssistantOpen } = useUiStore();
    const { mutate, status, data, error, reset } = useAISuggestMutation();
    const [prompt, setPrompt] = React.useState("");

    function handleClose() {
      setAIAssistantOpen(false);
      reset();
      setPrompt("");
    }

    function handleSubmit() {
      if (!prompt.trim()) return;
      mutate({ prompt: prompt.trim(), listId, listName, existingItemNames });
    }

    return (
      <Sheet
        open={isAIAssistantOpen}
        onOpenChange={(open) => { if (!open) handleClose(); }}
        snapPoints={[85, 50]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame padding="$4">
          {/* Prompt view (idle state) */}
          {status === "idle" && (
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="600">Sugestões de IA</Text>
              <TextArea
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Ex: lista para churrasco com 10 pessoas"
                numberOfLines={3}
                maxLength={500}
                autoFocus
                accessibilityLabel="Descreva o que você precisa comprar"
              />
              <Text fontSize="$2" color="$colorSubtle" textAlign="right">
                {prompt.length}/500
              </Text>
              <Button
                onPress={handleSubmit}
                disabled={!prompt.trim()}
                accessibilityLabel="Gerar sugestões"
              >
                Sugerir itens
              </Button>
            </YStack>
          )}
          {/* Other states: T015, T016 */}
        </Sheet.Frame>
      </Sheet>
    );
  }
  ```

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx` (NEW)

  **Dependências**: T011 (uiStore), T012 (mutation hook)

  **Critério de pronto**: Sheet abre/fecha corretamente; textarea aceita input; botão desabilitado com prompt vazio; `pnpm typecheck` passa.

  **Risco**: Médio — integração Tamagui Sheet requer `snapPoints` e `overlay` corretos.

  **Validação**: Abrir manualmente no dispositivo; verificar que o sheet aparece, aceita input, e fecha sem erros.

---

- [ ] T015 [US1] Add loading, error, and empty states to `AISuggestionSheet` in `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx`

  **Objetivo**: Completar os estados visuais do assistente para `pending`, `error`, e `success` com 0 sugestões — garantindo que o usuário sempre receba feedback claro.

  **Descrição técnica** — adicionar dentro do `Sheet.Frame` (após o bloco `idle`):
  ```tsx
  {/* Loading state */}
  {status === "pending" && (
    <YStack alignItems="center" gap="$4" paddingVertical="$8">
      <Spinner size="large" />
      <Text color="$colorSubtle">Gerando sugestões…</Text>
      <Button variant="outlined" size="$3" onPress={handleClose}>
        Cancelar
      </Button>
    </YStack>
  )}

  {/* Error state */}
  {status === "error" && (
    <YStack gap="$3">
      <Text fontSize="$4" color="$red10">
        Não foi possível gerar sugestões. Verifique sua conexão e tente novamente.
      </Text>
      <Button onPress={() => { reset(); setPrompt(""); }}>
        Tentar novamente
      </Button>
      <Button variant="outlined" onPress={handleClose}>
        Fechar
      </Button>
    </YStack>
  )}

  {/* Empty suggestions state */}
  {status === "success" && data?.suggestions.length === 0 && (
    <YStack gap="$3">
      <Text fontSize="$4">
        Nenhuma sugestão gerada para este pedido. Tente descrever com mais detalhes.
      </Text>
      <Button onPress={() => { reset(); }}>
        Tentar novamente
      </Button>
    </YStack>
  )}
  ```

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx` (MODIFY)

  **Dependências**: T014

  **Critério de pronto**: Cada estado é visualmente distinto; erro exibe mensagem amigável (não o erro técnico); estado vazio tem ação clara; botão "Cancelar" durante loading fecha o sheet sem salvar nada; `pnpm typecheck` passa.

  **Risco**: Baixo — mudança aditiva na sheet.

  **Validação**: Simular cada estado alterando o status do mock; verificar transições no dispositivo.

---

## Phase 5 — US2: Preview, Seleção e Tratamento de Duplicados

- [ ] T016 [US2] Add success/suggestions view with selection state to `AISuggestionSheet` in `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx`

  **Objetivo**: Implementar a view de preview com lista de sugestões, controle de seleção por `Set<string>`, e botão de confirmação — garantindo que nenhum item seja adicionado à lista sem ação explícita do usuário.

  **Descrição técnica** — adicionar estado de seleção e view de sucesso:
  ```tsx
  // Dentro de AISuggestionSheet, adicionar:
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Quando status muda para success, pré-selecionar pending items:
  React.useEffect(() => {
    if (status === "success" && data) {
      const autoSelected = new Set(
        data.suggestions
          .filter((s) => s.status === "pending")
          .map((s) => s.id)
      );
      setSelectedIds(autoSelected);
    }
  }, [status, data]);

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // View de sucesso com sugestões:
  {status === "success" && data && data.suggestions.length > 0 && (
    <YStack flex={1} gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$5" fontWeight="600">Sugestões</Text>
        <Button size="$2" variant="outlined" onPress={() => { reset(); }}>
          Nova busca
        </Button>
      </XStack>
      <ScrollView>
        {data.suggestions.map((suggestion) => (
          <SuggestionItemRow
            key={suggestion.id}
            suggestion={suggestion}
            isSelected={selectedIds.has(suggestion.id)}
            onToggle={toggleItem}
          />
        ))}
      </ScrollView>
      <Button
        onPress={() => handleConfirm(data.suggestions.filter((s) => selectedIds.has(s.id)))}
        disabled={selectedIds.size === 0 || isConfirming}
        accessibilityLabel={`Adicionar ${selectedIds.size} itens à lista`}
      >
        {isConfirming
          ? `Adicionando ${confirmProgress}…`
          : `Adicionar ${selectedIds.size} ${selectedIds.size === 1 ? "item" : "itens"}`}
      </Button>
    </YStack>
  )}
  ```

  **Comportamento de duplicados**: Sugestões com `status === "already_on_list"` são pré-deselecionadas (`not in autoSelected`), mostradas com badge muted, mas o usuário pode selecioná-las manualmente se quiser adicionar outra unidade.

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx` (MODIFY)

  **Dependências**: T013 (SuggestionItemRow), T015 (outros estados completos)

  **Critério de pronto**: Sugestões `pending` pré-selecionadas; `already_on_list` pré-deselecionadas e visualmente distintas; botão mostra contagem correta; botão desabilitado quando nenhum item selecionado; `pnpm typecheck` passa.

  **Risco**: Baixo — UI state local com `Set`.

  **Validação**: Verificar que itens `already_on_list` aparecem com badge e desmarcados; testar seleção/desseleção manual; botão mostra contagem correta.

---

## Phase 6 — US2: Confirmação e Integração com Produtos Reutilizáveis

- [ ] T017 [US2] Create `useConfirmSuggestions` hook in `apps/mobile/src/features/ai-assistant/useConfirmSuggestions.ts`

  **Objetivo**: Implementar a orquestração de confirmação — para cada sugestão selecionada: buscar produto existente, criar produto novo se não encontrar, adicionar item à lista com preço 0. Reutilizar os use cases existentes `SearchProducts`, `CreateProduct`, e `AddShoppingListItem`.

  **Descrição técnica**:
  ```ts
  // apps/mobile/src/features/ai-assistant/useConfirmSuggestions.ts
  import { useState } from "react";
  import { useQueryClient } from "@tanstack/react-query";
  import { queryKeys } from "../../application/query-keys/queryKeys";
  import { defaultRepositories } from "../../infrastructure/defaultRepositories";
  import { SearchProducts } from "../../application/use-cases/products";
  import { CreateProduct } from "../../application/use-cases/products";
  import { AddShoppingListItem } from "../../application/use-cases/shoppingListItems";
  import { SuggestedItem } from "../../domain/entities/AISuggestion";

  export function useConfirmSuggestions(listId: string) {
    const queryClient = useQueryClient();
    const [isConfirming, setIsConfirming] = useState(false);
    const [progress, setProgress] = useState(0);

    async function confirm(selected: SuggestedItem[]) {
      if (selected.length === 0) return;
      setIsConfirming(true);
      setProgress(0);

      const searchUseCase = new SearchProducts(defaultRepositories.products);
      const createProductUseCase = new CreateProduct(
        defaultRepositories.products,
        defaultRepositories.userEvents
      );
      const addItemUseCase = new AddShoppingListItem(
        defaultRepositories.shoppingListItems,
        defaultRepositories.shoppingLists,
        defaultRepositories.priceHistory,
        defaultRepositories.userEvents
      );

      for (let i = 0; i < selected.length; i++) {
        const suggestion = selected[i];
        setProgress(i + 1);

        // 1. Search for existing product by name
        const { products } = await searchUseCase.execute({
          searchTerm: suggestion.name,
          limit: 1,
        });

        let productId: string;

        const exactMatch = products.find(
          (p) => p.name.toLowerCase().trim() === suggestion.name.toLowerCase().trim()
        );

        if (exactMatch) {
          productId = exactMatch.id;
        } else {
          // 2. Create new product if no exact match
          const { product } = await createProductUseCase.execute({
            name: suggestion.name,
            unit: suggestion.unit,
          });
          productId = product.id;
        }

        // 3. Add item to list with quantity from suggestion and price 0
        await addItemUseCase.execute({
          listId,
          productId,
          quantity: suggestion.quantity,
          unitPrice: 0,
        });
      }

      // 4. Single cache invalidation after all items added
      await queryClient.invalidateQueries({
        queryKey: queryKeys.shoppingLists.detail(listId),
      });

      setIsConfirming(false);
    }

    return { confirm, isConfirming, progress };
  }
  ```

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/useConfirmSuggestions.ts` (NEW)

  **Dependências**: T006 (domain use cases), T010 (repositories registered)

  **Critério de pronto**: Para cada sugestão selecionada: produto existente é reutilizado (não criado novo); produto inexistente é criado; item adicionado com `unitPrice: 0`; cache invalidado uma vez ao final; `isConfirming` e `progress` refletem estado correto; `pnpm typecheck` passa.

  **Risco**: Alto — múltiplas chamadas sequenciais; falha no meio deixa itens parcialmente adicionados. Mitigação: falha na adição individual é logada mas não interrompe os demais itens (adicionar try/catch por item com counter de falhas).

  **Validação**: Teste unitário com use cases mockados (ver T045); verificar que `invalidateQueries` é chamado uma vez ao final.

---

- [ ] T018 [US2] Wire `useConfirmSuggestions` into `AISuggestionSheet` in `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx`

  **Objetivo**: Conectar o hook de confirmação à view de sucesso — passando `listId`, recebendo `isConfirming` e `progress`, fechando o sheet ao final.

  **Descrição técnica**:
  ```tsx
  // Em AISuggestionSheet, adicionar:
  const { confirm, isConfirming, progress } = useConfirmSuggestions(listId);

  async function handleConfirm(selected: SuggestedItem[]) {
    await confirm(selected);
    handleClose();
  }
  ```
  Passar `isConfirming` e `progress` para o botão de confirmação (já referenciado em T016).

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx` (MODIFY)

  **Dependências**: T016 (view de sugestões), T017 (hook de confirmação)

  **Critério de pronto**: Confirmar 3 sugestões adiciona 3 itens à lista; sheet fecha após confirmação; botão mostra `"Adicionando 2 de 3…"` durante o processo; `pnpm typecheck` passa.

  **Risco**: Médio — depende de use cases existentes funcionando corretamente com os parâmetros fornecidos.

  **Validação**: Teste manual completo com prompt → seleção → confirmação → verificar lista.

---

## Phase 7 — Integração com a Tela de Lista

- [ ] T019 [US1] Add AI icon button and wire `AISuggestionSheet` into `apps/mobile/src/app/(app)/(tabs)/lists/[listId]/index.tsx`

  **Objetivo**: Tornar o assistente de IA acessível a partir da tela de detalhe de lista ativa — adicionando um botão de ícone ao header e renderizando o `AISuggestionSheet` condicionalmente.

  **Descrição técnica**:
  ```tsx
  // Em [listId]/index.tsx — adicionar:
  import { useUiStore } from "../../../../shared/state/uiStore";
  import { AISuggestionSheet } from "../../../../features/ai-assistant/AISuggestionSheet";
  import { Sparkles } from "@tamagui/lucide-icons"; // ou ícone equivalente disponível

  const { setAIAssistantOpen } = useUiStore();

  // Dentro do header XStack (ao lado de "Item", "Completo", "Comparativo"):
  {list.status === "active" && (
    <Button
      size="$2"
      icon={Sparkles}
      onPress={() => setAIAssistantOpen(true)}
      accessibilityLabel="Sugestões de IA"
    />
  )}

  // Antes do fechamento do componente de tela:
  {list.status === "active" && (
    <AISuggestionSheet
      listId={listId}
      listName={list.name}
      existingItemNames={list.items.map((item) => item.product.name)}
    />
  )}
  ```

  **Arquivos afetados**: `apps/mobile/src/app/(app)/(tabs)/lists/[listId]/index.tsx` (MODIFY)

  **Dependências**: T014, T015, T016, T018 (AISuggestionSheet completa)

  **Critério de pronto**: Botão IA visível na tela de lista ativa; botão ausente em listas completas/arquivadas; sheet abre ao tocar; botão `+ Item` existente funciona sem interferência; `pnpm typecheck` passa.

  **Risco**: Médio — modificação em tela existente crítica; isolar em bloco `{list.status === "active" && ...}` para zero impacto em outros status.

  **Validação**: Verificar lista ativa (botão visível), lista completa (botão ausente), lista arquivada (botão ausente); verificar que `+ Item` funciona normalmente.

---

## Phase 8 — Robustez e Fallback

- [ ] T020 Add timeout handling to `SupabaseAIRepository` in `apps/mobile/src/infrastructure/repositories/SupabaseAIRepository.ts`

  **Objetivo**: Garantir que uma requisição à Edge Function que não responda em 30s gere um `AIServiceError` com mensagem amigável — sem travar a UI indefinidamente.

  **Descrição técnica**: O Supabase JS client não tem opção de timeout nativa em `functions.invoke`. Usar `Promise.race` com um timeout manual:
  ```ts
  async suggestItems(prompt, context): Promise<SuggestedItem[]> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AIServiceError("Request timeout", "unavailable")), 30000)
    );

    const invokePromise = this.supabase.functions.invoke("suggest-items", {
      body: { prompt, context },
    });

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);
    // ... resto do código existente
  }
  ```

  **Arquivos afetados**: `apps/mobile/src/infrastructure/repositories/SupabaseAIRepository.ts` (MODIFY)

  **Dependências**: T009

  **Critério de pronto**: Promise com delay > 30s lança `AIServiceError("unavailable")`; `pnpm typecheck` passa.

  **Risco**: Baixo — `Promise.race` é nativo.

  **Validação**: Mock `supabase.functions.invoke` para retornar uma promise que nunca resolve; verificar que após 30s o `useAISuggestMutation` entra em `status === "error"`.

---

- [ ] T021 Verify that AI failure does not block manual item creation flow in `apps/mobile/src/app/(app)/(tabs)/lists/[listId]/`

  **Objetivo**: Confirmar que o fluxo `+ Item` manual funciona normalmente mesmo quando o `SupabaseAIRepository` lança erro — verificação de não-regressão crítica.

  **Descrição técnica**: Não é necessário código novo. Esta task é uma validação:
  1. Simular AI indisponível (Edge Function retornando 503 ou desligada)
  2. Abrir uma lista ativa
  3. Usar `+ Item` para adicionar item manualmente
  4. Verificar que o item é adicionado, o budget é atualizado, e nenhum erro relacionado à IA aparece

  **Arquivos afetados**: Nenhum (validação)

  **Dependências**: T019 (integração completa)

  **Critério de pronto**: Com AI indisponível, todo o fluxo manual continua funcionando. O botão IA mostra erro ao tentar usar, mas não impacta o resto da tela.

  **Risco**: Baixo — verificação de isolamento.

  **Validação**: Teste manual com Edge Function desligada.

---

- [ ] T022 Validate that all items added via AI assistant have correct `user_id` and produce `ITEM_ADDED` events

  **Objetivo**: Garantir que os itens adicionados via fluxo de IA respeitam as regras de segurança RLS e auditoria de eventos — sem bypass das regras existentes.

  **Descrição técnica**: Verificação de comportamento existente:
  - `AddShoppingListItem` use case já seta `user_id` via repositório
  - `AddShoppingListItem` já gera evento `ITEM_ADDED` via `UserEventRepository`
  - A confirmação em `useConfirmSuggestions` chama `AddShoppingListItem` — portanto herda esses comportamentos

  Adicionar ao arquivo de testes de segurança existente (`apps/mobile/tests/security/`) um cenário: "items added via AI suggestion flow have user_id and ITEM_ADDED event".

  **Arquivos afetados**: `apps/mobile/tests/security/` (MODIFY — adicionar cenário)

  **Dependências**: T017

  **Critério de pronto**: Teste de segurança documenta e verifica que itens adicionados via `useConfirmSuggestions` têm `user_id` correto e geram evento `ITEM_ADDED`; `pnpm --filter mobile test` passa.

  **Risco**: Baixo — comportamento herdado do `AddShoppingListItem`.

  **Validação**: `pnpm --filter mobile test`

---

## Phase 9 — UX e Acessibilidade

- [ ] T023 Add auto-focus to prompt `TextArea` when `AISuggestionSheet` opens in `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx`

  **Objetivo**: Melhorar a velocidade percebida — teclado abre automaticamente quando o sheet aparece, sem necessidade de tap adicional.

  **Descrição técnica**:
  ```tsx
  const textAreaRef = useRef<TextInput>(null);

  // Ao abrir o sheet (status idle):
  React.useEffect(() => {
    if (isAIAssistantOpen && status === "idle") {
      // Pequeno delay para garantir que o sheet está montado
      const timer = setTimeout(() => textAreaRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isAIAssistantOpen, status]);

  // Na TextArea:
  <TextArea ref={textAreaRef} ... />
  ```

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx` (MODIFY)

  **Dependências**: T015

  **Critério de pronto**: Ao abrir o sheet, o teclado abre automaticamente dentro de 400ms no iOS e Android; ao fechar e reabrir, o foco é restaurado.

  **Risco**: Baixo — padrão comum em modais mobile.

  **Validação**: Testar em dispositivo físico iOS e Android.

---

- [ ] T024 Add confirmation progress feedback to `AISuggestionSheet` during sequential item addition in `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx`

  **Objetivo**: Mostrar progresso durante a adição sequencial de itens — evitando que o usuário pense que o app travou quando 10+ itens estão sendo adicionados.

  **Descrição técnica**: O hook `useConfirmSuggestions` já retorna `progress` (T017). Usar na label do botão de confirmação:
  ```tsx
  // No botão de confirmação:
  {isConfirming
    ? `Adicionando ${progress} de ${selectedIds.size}…`
    : `Adicionar ${selectedIds.size} ${selectedIds.size === 1 ? "item" : "itens"}`
  }
  ```
  Desabilitar o botão durante `isConfirming` para evitar dupla-submissão.

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/AISuggestionSheet.tsx` (MODIFY, pequena mudança)

  **Dependências**: T016, T018

  **Critério de pronto**: Botão mostra "Adicionando 1 de 5…" durante a confirmação; atualiza para "Adicionando 2 de 5…" etc.; botão bloqueado durante confirmação.

  **Risco**: Baixo.

  **Validação**: Confirmar 5+ sugestões e observar a progressão no botão.

---

- [ ] T025 Audit all interactive elements in `ai-assistant/` for accessibility labels and touch targets

  **Objetivo**: Garantir que todos os elementos interativos do assistente de IA tenham `accessibilityLabel` correto e área de toque ≥ 44x44pt (padrão Apple/Google).

  **Descrição técnica**: Revisar e corrigir se necessário em:
  - `SuggestionItemRow`: `accessibilityRole="checkbox"`, `accessibilityState`, `accessibilityLabel` com nome + quantidade
  - `AISuggestionSheet`: botões "Sugerir itens", "Cancelar", "Tentar novamente", "Fechar", "Adicionar N itens"
  - Botão IA no header de `[listId]/index.tsx`: `accessibilityLabel="Sugestões de IA"`
  - Garantir que `TextArea` tenha `accessibilityLabel`
  - Tamanho mínimo de toque: usar `hitSlop` ou `minHeight: 44` onde necessário

  **Arquivos afetados**: `apps/mobile/src/features/ai-assistant/*.tsx`, `apps/mobile/src/app/(app)/(tabs)/lists/[listId]/index.tsx` (REVIEW + MODIFY)

  **Dependências**: T019

  **Critério de pronto**: Todos os botões e checkboxes têm `accessibilityLabel`; nenhum elemento interativo tem área de toque < 44pt; navegação por leitor de tela funciona logicamente.

  **Risco**: Baixo.

  **Validação**: Usar VoiceOver (iOS) ou TalkBack (Android) para navegar pelo assistente.

---

## Phase 10 — Qualidade e Validação Final

- [ ] T026 [P] Unit test `SuggestShoppingListItems` use case in `apps/mobile/tests/unit/aiSuggestions.test.ts`

  **Objetivo**: Cobrir a lógica de detecção de duplicatas e anotação de status com testes unitários isolados — use case testável com mock do `AIRepository`.

  **Descrição técnica**:
  ```ts
  // apps/mobile/tests/unit/aiSuggestions.test.ts
  describe("SuggestShoppingListItems", () => {
    const mockAI: AIRepository = {
      suggestItems: vi.fn(),
    };
    const useCase = new SuggestShoppingListItems(mockAI);

    it("marks suggestion as already_on_list when name matches existing item (case-insensitive)", async () => {
      vi.mocked(mockAI.suggestItems).mockResolvedValue([
        { id: "1", name: "Arroz", quantity: 2, status: "pending" },
      ]);
      const result = await useCase.execute({
        prompt: "básicos",
        listId: "l1",
        listName: "Compras",
        existingItemNames: ["arroz"], // lowercase
      });
      expect(result.suggestions[0].status).toBe("already_on_list");
    });

    it("marks suggestion as pending when name does not match existing items", async () => { ... });
    it("handles empty AI response gracefully", async () => { ... });
    it("generates unique id for each suggestion", async () => { ... });
    it("trims whitespace before comparison", async () => { ... });
  });
  ```

  **Arquivos afetados**: `apps/mobile/tests/unit/aiSuggestions.test.ts` (NEW)

  **Dependências**: T006

  **Critério de pronto**: Todos os cenários passam; `pnpm --filter mobile test` passa.

  **Risco**: Baixo.

  **Validação**: `pnpm --filter mobile test -- aiSuggestions`

---

- [ ] T027 [P] Unit test `SupabaseAIRepository` with mocked `supabase.functions.invoke` in `apps/mobile/tests/unit/SupabaseAIRepository.test.ts`

  **Objetivo**: Verificar que o adapter de infraestrutura valida respostas, mapeia `SuggestedItem[]` corretamente, e lança `AIServiceError` nas condições de erro.

  **Descrição técnica**:
  ```ts
  describe("SupabaseAIRepository", () => {
    it("returns SuggestedItem[] for valid response", async () => { ... });
    it("throws AIServiceError('invalid_response') when Zod parse fails", async () => { ... });
    it("throws AIServiceError('unavailable') when invoke returns error", async () => { ... });
    it("throws AIServiceError('unauthorized') for 401 error", async () => { ... });
    it("filters out suggestions with empty name (Zod)", async () => { ... });
  });
  ```

  **Arquivos afetados**: `apps/mobile/tests/unit/SupabaseAIRepository.test.ts` (NEW)

  **Dependências**: T009

  **Critério de pronto**: Todos os cenários passam; mock do Supabase client é limpo; `pnpm --filter mobile test` passa.

  **Risco**: Baixo.

  **Validação**: `pnpm --filter mobile test -- SupabaseAIRepository`

---

- [ ] T028 [P] Unit test Zod schema in `apps/mobile/tests/unit/aiAssistant.schemas.test.ts`

  **Objetivo**: Cobrir os casos limítrofes de validação do schema — garantindo que entradas inválidas da IA são rejeitadas antes de chegar à UI.

  **Descrição técnica**:
  ```ts
  describe("aiSuggestionsResponseSchema", () => {
    it("accepts valid suggestions array", () => { ... });
    it("rejects suggestion with empty name", () => { ... });
    it("rejects suggestion with quantity 0", () => { ... });
    it("rejects suggestion with quantity negative", () => { ... });
    it("accepts suggestion without optional fields", () => { ... });
    it("accepts suggestions array with 0 items", () => { ... });
    it("rejects more than 20 suggestions", () => { ... });
  });
  ```

  **Arquivos afetados**: `apps/mobile/tests/unit/aiAssistant.schemas.test.ts` (NEW)

  **Dependências**: T005

  **Critério de pronto**: Todos os cenários passam; `pnpm --filter mobile test` passa.

  **Risco**: Baixo.

  **Validação**: `pnpm --filter mobile test -- aiAssistant.schemas`

---

- [ ] T029 [P] Unit test `useConfirmSuggestions` hook with mocked use cases in `apps/mobile/tests/unit/useConfirmSuggestions.test.ts`

  **Objetivo**: Verificar a lógica de correspondência de produtos e orquestração sequencial — sem dependência de Supabase real.

  **Descrição técnica**:
  ```ts
  describe("useConfirmSuggestions", () => {
    it("reuses existing product when exact name match found", async () => { ... });
    it("creates new product when no exact match found", async () => { ... });
    it("calls AddShoppingListItem with quantity from suggestion and unitPrice 0", async () => { ... });
    it("invalidates list detail query once after all items added", async () => { ... });
    it("continues adding remaining items if one fails", async () => { ... });
  });
  ```

  **Arquivos afetados**: `apps/mobile/tests/unit/useConfirmSuggestions.test.ts` (NEW)

  **Dependências**: T017

  **Critério de pronto**: Todos os cenários passam; `pnpm --filter mobile test` passa.

  **Risco**: Baixo.

  **Validação**: `pnpm --filter mobile test -- useConfirmSuggestions`

---

- [ ] T030 Manual end-to-end test: full AI assistant flow

  **Objetivo**: Validar o fluxo completo do assistente de IA em dispositivo real — do prompt à lista atualizada.

  **Checklist de teste**:
  - [ ] Abrir uma lista ativa → botão IA visível no header
  - [ ] Tocar no botão IA → sheet abre com prompt, teclado abre automaticamente
  - [ ] Digitar "churrasco para 10 pessoas" → botão "Sugerir itens" habilitado
  - [ ] Submeter → loading state exibido imediatamente
  - [ ] Após resposta → sugestões listadas, todas pré-selecionadas (exceto duplicatas)
  - [ ] Desselecionar 2 itens → contagem no botão atualiza
  - [ ] Confirmar → progresso mostrado, sheet fecha
  - [ ] Lista mostra novos itens, totais atualizados
  - [ ] Budgets refletem novos itens (price 0, não impacta over-budget)
  - [ ] Usar `+ Item` manualmente → funciona normalmente
  - [ ] Abrir lista completa → botão IA ausente
  - [ ] Abrir lista arquivada → botão IA ausente

  **Arquivos afetados**: Nenhum (validação manual)

  **Dependências**: T019 (integração completa)

  **Critério de pronto**: Todos os itens do checklist passam em dispositivo físico (ou simulador com backend real).

  **Risco**: Alto — ponto de integração final; requer Edge Function deployada e API key configurada.

  **Validação**: Checklist acima, executado pelo desenvolvedor.

---

- [ ] T031 Manual regression test: existing manual flows unchanged

  **Objetivo**: Garantir que nenhuma das funcionalidades existentes foi afetada pela adição do assistente de IA.

  **Checklist de regressão**:
  - [ ] Criar nova lista → funciona
  - [ ] Adicionar item manualmente (+ Item) → funciona
  - [ ] Editar item → funciona
  - [ ] Remover item → funciona
  - [ ] Marcar item como comprado → funciona
  - [ ] Completar lista → funciona; botão IA some
  - [ ] Arquivar lista → funciona; botão IA ausente na lista arquivada
  - [ ] Ver comparativo de preços (insights) → funciona
  - [ ] Navegar entre abas → funciona
  - [ ] Login/logout → funciona
  - [ ] Lista arquivada → funciona

  **Arquivos afetados**: Nenhum (validação manual)

  **Dependências**: T030

  **Critério de pronto**: Todos os itens do checklist passam.

  **Validação**: Checklist acima.

---

- [ ] T032 Run full validation suite: typecheck, lint, tests in workspace root

  **Objetivo**: Confirmar que o branch está pronto para code review — sem erros de tipagem, sem violações de lint, e todos os testes passando.

  **Comandos a executar** (em ordem):
  ```bash
  pnpm typecheck
  pnpm lint
  pnpm --filter mobile test
  pnpm format:check
  ```

  **Critério de pronto**: Todos os comandos terminam com exit code 0; nenhum novo erro de TypeScript, lint, ou teste introduzido pela feature.

  **Dependências**: T026, T027, T028, T029, T031

  **Risco**: Médio — potenciais erros de tipo em arquivos modificados; corrigir antes de merge.

  **Validação**: Saída limpa de todos os comandos acima.

---

## Task Summary

| Phase | Tasks | Story | Count |
|-------|-------|-------|-------|
| 1 — Auditoria | T001–T002 | — | 2 (✅ COMPLETE) |
| 2 — Foundation | T003–T008 | — | 6 |
| 3 — Infrastructure | T009–T012 | — | 4 |
| 4 — US1 UI | T013–T015 | US1 | 3 |
| 5 — US2 Preview | T016 | US2 | 1 |
| 6 — US2 Confirmation | T017–T018 | US2 | 2 |
| 7 — Integration | T019 | US1+US2 | 1 |
| 8 — Robustez | T020–T022 | — | 3 |
| 9 — UX | T023–T025 | — | 3 |
| 10 — Qualidade | T026–T032 | — | 7 |

**Total**: 32 tasks (2 complete, 30 a implementar)

**Parallel opportunities**:
- T003 + T004 (diferentes arquivos, sem dependência entre si)
- T007 (Edge Function) pode iniciar em paralelo com T005 + T006
- T026 + T027 + T028 + T029 (testes unitários, todos independentes entre si)

**MVP scope sugerido**: Phases 2–7 (T003–T019) — feature funcional e completa. Phases 8–10 são polimento e validação que podem seguir em paralelo ou imediatamente após.
