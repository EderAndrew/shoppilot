# Implementation Plan: Banco Local SQLite e Modo Offline-First

**Branch**: `006-sqlite-offline-first` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/006-sqlite-offline-first/spec.md`

## Summary

Introduzir armazenamento local com `expo-sqlite` para que criação, edição e remoção de itens de compras reflitam na UI instantaneamente, sem aguardar resposta do Supabase. A arquitetura de ports/adapters existente é preservada: dois novos repositórios `LocalFirst*` implementam os ports atuais e orquestram escrita local → sync remoto em background. O Supabase continua como fonte de verdade remota; o SQLite passa a ser a fonte primária da UI nesta fase.

## Technical Context

**Language/Version**: TypeScript 5.x / React Native 0.81.5 / Expo SDK 54  
**Primary Dependencies**: expo-sqlite v16 (já instalado), expo-router v6, TanStack Query v5, Tamagui 2.x, Zustand v5, React Hook Form v7, Zod v4  
**Storage**: SQLite local (expo-sqlite) como fonte primária da UI; Supabase (PostgreSQL) como backend remoto  
**Testing**: Vitest (node environment) — unit para repositórios locais e use cases; security para isolamento de dados por usuário  
**Target Platform**: iOS 15+ e Android API 26+ via Expo; React Native Web (telas de auth)  
**Project Type**: Mobile-first consumer app (Expo Router + Supabase + SQLite)  
**Performance Goals**: Adição/edição de item refletida na UI em < 300ms; carga offline de lista em < 1s  
**Constraints**: SQLite escrita local não-bloqueante; sync remoto fire-and-forget; sem resolução de conflitos complexa (Fase 3); sem perda de dados em falha de rede  
**Scale/Scope**: Usuário único por dispositivo; listas e itens de compras pessoais

## Constitution Check

- **Layering**: PASS — `LocalFirst*Repository` implementa ports existentes em `infrastructure/local/`. Domain e Application não mudam. Nenhum componente UI acessa SQLite diretamente.
- **Backend-ready data access**: PASS — UI continua chamando use cases que chamam ports. A troca por repositórios locais ocorre apenas em `defaultRepositories.ts`. O padrão Mobile → API → DB da constitution é preservado.
- **Domain model**: PASS — `ShoppingList`, `ShoppingListItem`, `Product`, `PriceHistory` permanecem na camada de domínio inalterados. `SyncStatus` é um tipo de infraestrutura, não de domínio.
- **History and auditability**: PASS — `price_history` e `user_events` continuam sendo escritos no Supabase. A Fase 2 não modifica esses fluxos. Soft delete local (`deleted_at`) preserva histórico.
- **Security**: PASS — dados locais são sempre scoped por `user_id`. A troca de usuário (logout → novo login) deve limpar dados locais do usuário anterior (tratado no fluxo de logout). RLS Supabase permanece ativo para o sync remoto. Nenhum segredo vaza para o SQLite.
- **Typing and shared models**: PASS — `SyncStatus` é definido em um único arquivo. `ShoppingListItemRecord` recebe campo `syncStatus?` opcional que não quebra implementações existentes.
- **Observability**: PASS — erros de sync remoto são logados via `logger.ts` existente. Items com `sync_status = 'error'` são visíveis no banco local para debugging.
- **Testing**: PASS — repositórios SQLite têm testes de unidade. Isolamento de dados por `user_id` tem teste de segurança. Use cases existentes não precisam de novos testes (não mudam).
- **Action-oriented UX**: PASS — esta feature é diretamente orientada a tornar as ações instantâneas no contexto de mercado.
- **AI readiness**: PASS — `price_history` e `user_events` não mudam. Dados de compras locais ficam disponíveis para futura extração/análise na Fase 3.

## Project Structure

### Documentation (this feature)

```text
specs/006-sqlite-offline-first/
├── plan.md              # Este arquivo
├── research.md          # Decisões de pesquisa (concluído)
├── data-model.md        # Schema local e mapeamentos (concluído)
├── checklists/
│   └── requirements.md  # Checklist de qualidade da spec
└── tasks.md             # /speckit.tasks (próximo passo)
```

### Source Code (arquivos novos e modificados)

```text
apps/mobile/
├── package.json                                      [MODIFICAR] adicionar expo-network

apps/mobile/src/
├── lib/
│   └── db/                                           [NOVO]
│       ├── database.ts                               # openDatabaseAsync + instância singleton
│       ├── migrations.ts                             # runner de migrations + definições
│       └── schema.ts                                 # constantes SQL CREATE TABLE / INDEX

├── infrastructure/
│   ├── local/                                        [NOVO]
│   │   ├── sync.types.ts                             # enum SyncStatus
│   │   ├── localDbMapper.ts                          # SQLite row → ShoppingListRecord / ItemRecord
│   │   ├── SQLiteShoppingListRepository.ts           # implementa ShoppingListRepository port
│   │   ├── SQLiteShoppingListItemRepository.ts       # implementa ShoppingListItemRepository port
│   │   ├── LocalFirstShoppingListRepository.ts       # orquestra SQLite + Supabase
│   │   └── LocalFirstShoppingListItemRepository.ts  # orquestra SQLite + Supabase
│   └── repositories/
│       └── defaultRepositories.ts                    [MODIFICAR] wire LocalFirst repos

├── application/
│   └── ports/
│       ├── ShoppingListRepository.ts                 [MODIFICAR] adicionar syncStatus? opcional
│       └── ShoppingListItemRepository.ts             [MODIFICAR] adicionar syncStatus? opcional

├── features/
│   ├── shopping-list-items/
│   │   ├── item.queries.ts                           [MODIFICAR] adicionar usePendingSyncCountQuery
│   │   └── ShoppingListItemRow.tsx                   [MODIFICAR] exibir badge de sync_status
│   └── shopping-list/
│       └── shoppingList.queries.ts                   [MODIFICAR] adicionar useHydrateListFromRemote

└── shared/
    └── providers/
        └── AppProviders.tsx                          [MODIFICAR] adicionar SQLiteProvider + DbInitializer
```

## Complexity Tracking

| Situação | Por que é necessário | Alternativa mais simples rejeitada porque |
|----------|----------------------|------------------------------------------|
| Dois repositórios por entidade (SQLite + Supabase) | Port/adapter pattern da constitution exige separação | Modificar SupabaseRepository diretamente acoplaria SQLite em código Supabase |
| `LocalFirst*Repository` como orquestrador | Evitar lógica de sync nos use cases ou componentes | Use case não pode gerenciar sync (não é responsabilidade de negócio) |
| `syncStatus?` opcional no record existente | Manter compatibilidade sem novos ports | Criar port `LocalShoppingListItemRepository` separado duplicaria abstração |

---

## Phase 0: Research

**Status**: CONCLUÍDA — ver `research.md`

Decisões chave:
- D-001: expo-sqlite v16 já instalado
- D-003: `globalThis.crypto.randomUUID()` para UUIDs locais
- D-004: Instalar `expo-network` para detecção de conectividade
- D-006: `LocalFirst*Repository` implementa ports existentes (sem alterar use cases)
- D-009: `queryFn` lê do SQLite; hidratação remota é efeito separado
- D-014: `usePendingSyncCountQuery()` para indicador de pendência

---

## Phase 1: Design & Contracts

### 1.1 Fluxo de escrita (criar item)

```
[UI Form] → useAddShoppingListItemMutation
  → AddShoppingListItem.execute() [use case — sem mudança]
    → LocalFirstShoppingListItemRepository.add() [NOVO]
      1. generateId() → UUID local
      2. SQLiteShoppingListItemRepository.add() → retorna LocalItemRecord (sync_status: pending_create)
      3. Retorna LocalItemRecord para use case (UI atualiza via TanStack Query invalidation)
      4. void backgroundSync():
           isConnected? → SupabaseShoppingListItemRepository.add()
             ✓ → SQLiteRepo.updateSyncStatus(localId, 'synced', remoteId)
                 → queryClient.invalidateQueries(itemsKey)  [badge atualiza]
             ✗ → SQLiteRepo.updateSyncStatus(localId, 'error')
                 → logger.warn(...)
```

### 1.2 Fluxo de leitura (detalhe da lista)

```
[Tela ListDetail] → useShoppingListDetailsQuery(listId)
  queryFn: LocalFirstShoppingListRepository.getDetails(listId)
    → SQLiteShoppingListRepository.getDetails(listId)  [retorna rápido]
    
[useEffect na tela] → useHydrateListFromRemote(listId)
  → SupabaseShoppingListRepository.getDetails(listId)
    → upsert listas e itens no SQLite (preservando pending)
    → queryClient.invalidateQueries(detail(listId))  [re-render com dados frescos]
```

### 1.3 Fluxo de remoção

```
[UI] → useRemoveShoppingListItemMutation
  → RemoveShoppingListItem.execute() [use case — sem mudança]
    → LocalFirstShoppingListItemRepository.remove(itemId)
      1. Ler item do SQLite
      2a. Se sem remote_id: SQLiteRepo.hardDelete(itemId) — item local nunca sincronizado
      2b. Se com remote_id:
          SQLiteRepo.softDelete(itemId) → deleted_at + sync_status: pending_delete
      3. Retorna (item some da UI via invalidação)
      4. void backgroundSync() [se remote_id]:
           SupabaseShoppingListItemRepository.remove(remote_id)
             ✓ → SQLiteRepo.hardDelete(itemId) [ou manter soft-deleted para auditoria]
             ✗ → logger.warn(...)  [item permanece pending_delete]
```

### 1.4 Inicialização do banco (App startup)

```
AppProviders.tsx
└── <SQLiteProvider databaseName="shoppilot.db" onInit={runMigrations}>
      runMigrations(db):
        1. CREATE TABLE IF NOT EXISTS _local_migrations
        2. SELECT max(version) FROM _local_migrations
        3. Para cada migration com version > maxApplied:
             await migration.up(db)
             INSERT INTO _local_migrations (version, name, applied_at)
```

### 1.5 Limpar dados ao fazer logout

```
useLogoutMutation.onSuccess:
  → SQLiteShoppingListRepository.deleteAllForUser(userId)
  → SQLiteShoppingListItemRepository.deleteAllForUser(userId)
  [garante que dados do usuário anterior não vazam]
```

---

## Contrato de Interfaces (Novos Repositórios)

### `SQLiteShoppingListItemRepository`

```ts
interface SQLiteShoppingListItemRepository {
  add(input: AddItemLocalInput): Promise<ShoppingListItemRecord>
  update(input: UpdateShoppingListItemInput): Promise<ShoppingListItemRecord>
  remove(itemId: string): Promise<void>              // hard delete
  softDelete(itemId: string): Promise<void>          // pending_delete
  setBought(input: SetShoppingListItemBoughtInput): Promise<ShoppingListItemRecord>
  listByShoppingList(listId: string): Promise<ShoppingListItemRecord[]>  // excluindo deleted_at
  findById(itemId: string): Promise<ShoppingListItemRecord | null>
  findByRemoteId(remoteId: string): Promise<ShoppingListItemRecord | null>
  updateSyncStatus(localId: string, status: SyncStatus, remoteId?: string): Promise<void>
  countPendingSync(userId: string): Promise<number>
  deleteAllForUser(userId: string): Promise<void>
}
```

### `SQLiteShoppingListRepository`

```ts
interface SQLiteShoppingListRepository {
  create(input: CreateShoppingListInput & { userId: string }): Promise<ShoppingListRecord>
  list(userId: string): Promise<ShoppingListRecord[]>
  listActive(userId: string): Promise<ShoppingListRecord[]>
  listArchived(userId: string): Promise<ShoppingListRecord[]>
  getDetails(listId: string): Promise<ShoppingListDetails | null>
  findByRemoteId(remoteId: string): Promise<ShoppingListRecord | null>
  updateSyncStatus(localId: string, status: SyncStatus, remoteId?: string): Promise<void>
  upsertFromRemote(list: ShoppingListRecord): Promise<void>  // hidratação
  deleteAllForUser(userId: string): Promise<void>
}
```

### `LocalFirstShoppingListItemRepository` (implementa `ShoppingListItemRepository`)

```ts
// Implementa o port existente — use cases não precisam mudar
class LocalFirstShoppingListItemRepository implements ShoppingListItemRepository {
  constructor(
    private readonly local: SQLiteShoppingListItemRepository,
    private readonly remote: ShoppingListItemRepository,  // SupabaseRepo
    private readonly auth: AuthRepository,
    private readonly network: NetworkService,
  ) {}
  
  async add(input): Promise<ShoppingListItemRecord> { ... }
  async update(input): Promise<ShoppingListItemRecord> { ... }
  async remove(itemId): Promise<void> { ... }
  async setBought(input): Promise<ShoppingListItemRecord> { ... }
  async listByShoppingList(listId): Promise<ShoppingListItemRecord[]> { ... }
}
```

---

## Etapas de Implementação

### Etapa 1 — Fundação SQLite (sem quebrar nada)

**Objetivo**: SQLite inicializado, migrations rodando, schema criado. App funciona exatamente como antes.

Arquivos criados:
- `src/lib/db/schema.ts` — strings SQL para CREATE TABLE e CREATE INDEX
- `src/lib/db/migrations.ts` — array de migrations com `version` e `up(db)`; migration 001 cria as tabelas
- `src/lib/db/database.ts` — abre o banco, exporta tipo `LocalDatabase`
- `src/shared/providers/AppProviders.tsx` — adiciona `<SQLiteProvider>` com `onInit`

**Critério de conclusão**: App abre sem erro. Banco `shoppilot.db` criado. Tabelas existem. Migration 001 aparece em `_local_migrations`. Funcionalidades da Fase 1 intactas.

---

### Etapa 2 — Repositórios SQLite isolados

**Objetivo**: Repositórios de leitura/escrita local funcionando e testados.

Arquivos criados:
- `src/infrastructure/local/sync.types.ts` — enum `SyncStatus`
- `src/infrastructure/local/localDbMapper.ts` — funções `rowToListRecord()`, `rowToItemRecord()`
- `src/infrastructure/local/SQLiteShoppingListRepository.ts`
- `src/infrastructure/local/SQLiteShoppingListItemRepository.ts`

Arquivos modificados:
- `src/application/ports/ShoppingListItemRepository.ts` — adicionar `syncStatus?: SyncStatus`
- `src/application/ports/ShoppingListRepository.ts` — adicionar `syncStatus?: SyncStatus`

Testes unitários:
- `tests/unit/infrastructure/SQLiteShoppingListItemRepository.test.ts`
- `tests/unit/infrastructure/SQLiteShoppingListRepository.test.ts`

**Critério**: CRUD local funciona em testes. Soft delete registra `deleted_at`. `countPendingSync` retorna valores corretos.

---

### Etapa 3 — Repositórios LocalFirst + wiring

**Objetivo**: Mutations de item usam SQLite primeiro. UI atualiza sem aguardar Supabase.

Arquivos criados:
- `src/infrastructure/local/LocalFirstShoppingListItemRepository.ts`
- `src/infrastructure/local/LocalFirstShoppingListRepository.ts`
- `src/infrastructure/local/networkService.ts` — wrapper fino sobre `expo-network`

Arquivos modificados:
- `apps/mobile/package.json` — adicionar `expo-network`
- `src/infrastructure/repositories/defaultRepositories.ts` — trocar `SupabaseShoppingListItemRepository` e `SupabaseShoppingListRepository` por versões `LocalFirst`

**Critério**: Criar item com internet → aparece em < 300ms → depois sincroniza. Criar item sem internet → aparece imediatamente → fica `pending_create`.

---

### Etapa 4 — Leitura local + hidratação remota

**Objetivo**: UI lê do SQLite ao abrir lista. Supabase hidrata SQLite em background.

Arquivos modificados:
- `src/features/shopping-list/shoppingList.queries.ts` — adicionar `useHydrateListFromRemote(listId)`
- Tela de detalhe da lista — adicionar `useEffect(() => hydrateList(listId), [listId])`

**Critério**: App funciona offline — lista e itens aparecem do SQLite. Ao retomar conexão, dados frescos do Supabase aparecem em background.

---

### Etapa 5 — Indicador de pendência

**Objetivo**: UI mostra quando há itens não sincronizados.

Arquivos modificados:
- `src/features/shopping-list-items/item.queries.ts` — adicionar `usePendingSyncCountQuery(userId)`
- `src/features/shopping-list-items/ShoppingListItemRow.tsx` — exibir badge discreto se `syncStatus !== 'synced'`
- Tela de lista — exibir indicador global se `pendingCount > 0`

**Critério**: Offline, criar item → badge "Pendente" aparece. Reconectar e sincronizar → badge desaparece.

---

### Etapa 6 — Limpar dados no logout

**Objetivo**: Dados locais do usuário removidos ao fazer logout.

Arquivos modificados:
- `src/features/auth/auth.queries.ts` — `useLogoutMutation.onSuccess` chama `clearLocalData(userId)`
- `src/infrastructure/local/LocalFirstShoppingListItemRepository.ts` — expor `clearUserData()`

**Critério**: Logout → novo login com outro usuário não vê dados do usuário anterior.

---

### Etapa 7 — Validação e qualidade final

**Objetivo**: Todos os cenários de aceite verificados. Fase 1 sem regressões.

Checklist de testes manuais:
- [ ] App abre → banco criado → migration executada
- [ ] Adicionar item com internet → aparece em < 300ms → sincroniza
- [ ] Adicionar item sem internet → aparece imediatamente → badge "Pendente"
- [ ] Fechar app → abrir sem internet → itens locais aparecem
- [ ] Editar item com internet → muda imediatamente
- [ ] Editar item sem internet → muda imediatamente → badge atualiza
- [ ] Remover item → some imediatamente
- [ ] Lista arquivada → adicionar item bloqueado (offline e online)
- [ ] Logout → login → sem dados do usuário anterior
- [ ] Funcionalidades Fase 1: sessão persistente, edição de produto, campo marca, versionamento

Comandos de qualidade:
```bash
pnpm typecheck
pnpm lint
pnpm --filter mobile test
pnpm mobile:start
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| IDs locais vs remotos causar duplicação no upsert | Média | Upsert usa `remote_id` como chave de deduplicação; preserva `pending_*` items |
| `SQLiteProvider` conflitar com Expo Go | Baixa | expo-sqlite v16 suporta Expo Go 54; usar dev build se necessário |
| Dados pendentes sobrescritos por hidratação remota | Alta | `upsertFromRemote` ignora itens com `sync_status != 'synced'` |
| `globalThis.crypto.randomUUID()` indisponível | Baixa | Fallback: `expo-crypto.randomUUID()` disponível no SDK 54 |
| TanStack Query invalidar queries remotas recursivamente | Média | Usar `exact: true` em invalidações; separar query keys locais/remotas se necessário |
| Logout sem limpar SQLite | Alta | Tratado explicitamente na Etapa 6 |

---

## Notas de Implementação

### UUID local

```ts
function generateLocalId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  // fallback simples, suficiente para localização local
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
```

### Background sync (padrão)

```ts
// LocalFirstShoppingListItemRepository.add()
async add(input): Promise<ShoppingListItemRecord> {
  const localRecord = await this.local.add({ ...input, syncStatus: 'pending_create' })
  
  // fire-and-forget — não bloqueia o retorno
  void this.syncCreate(localRecord, input)
  
  return localRecord
}

private async syncCreate(local: ShoppingListItemRecord, input: AddShoppingListItemInput) {
  try {
    const isConnected = await this.network.isConnected()
    if (!isConnected) return
    
    const remote = await this.remote.add(input)
    await this.local.updateSyncStatus(local.id, 'synced', remote.id)
    this.queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.items(input.shoppingListId) })
  } catch (err) {
    await this.local.updateSyncStatus(local.id, 'error')
    logger.warn('Falha ao sincronizar item criado', { localId: local.id, err })
  }
}
```

### Upsert seguro (hidratação)

```ts
// SQLiteShoppingListItemRepository.upsertFromRemote()
// Ignora itens locais com sync_status pendente — não sobrescreve dados não sincronizados
async upsertFromRemote(remoteItem: ShoppingListItemRecord): Promise<void> {
  const existing = await this.findByRemoteId(remoteItem.id)
  
  if (existing && existing.syncStatus !== 'synced') {
    // item tem mudanças locais pendentes — não sobrescrever
    return
  }
  
  if (existing) {
    await this.updateFromRemote(existing.id, remoteItem)
  } else {
    await this.insertFromRemote(remoteItem)
  }
}
```

---

## Decisões Técnicas da Fase 2 (registradas em T052)

### `globalThis.crypto.randomUUID()`

Usado para gerar UUIDs locais sem dependências externas. Disponível no Hermes runtime (React Native 0.71+) e no ambiente de teste Vitest (Node.js). Fallback: `expo-crypto.randomUUID()` se necessário. IDs locais têm o mesmo formato UUID v4 que os IDs do Supabase para evitar colisões ao comparar strings.

### Padrão fire-and-forget para sync remoto

Todos os métodos `syncCreate`, `syncUpdate`, `syncDelete`, `syncArchive`, `syncComplete` são invocados com `void` (sem await). Isso garante que a mutation local retorna em < 300ms independentemente da latência de rede. O try/catch interno captura falhas silenciosamente — o item permanece com `sync_status = 'error'` e o log `logger.warn` é registrado. A UI nunca recebe exceções de rede dos métodos de sync.

### Por que `price_history` e `user_events` ficam apenas no Supabase

Essas tabelas são append-only e de auditoria — não fazem parte do fluxo de escrita interativo. O custo de sync bidirecional seria alto e os ganhos de UX, baixos (usuário não precisa ver histórico de preços offline imediatamente). A Fase 3 pode adicionar cache local dessas tabelas se necessário.

### Itens para a Fase 3

- **Retry automático robusto**: fila de sync persistida (ex.: tabela `_sync_queue`) com retry exponencial para itens em `sync_status = 'error'`
- **Reconciliação bidirecional**: detectar conflitos quando remote e local foram modificados independentemente; estratégia "last-write-wins" ou merge por campo
- **Resolução de conflitos**: timestamp comparison + user notification para conflitos detectados
- **Limpeza de soft-deletes antigos**: cron job ou trigger local para purgar `deleted_at IS NOT NULL` após N dias
- **Sync de `price_history` e `user_events`**: cache local para insights offline
- **Indicador de "sincronizando agora"**: spinner durante sync ativo (não apenas contador de pendentes)
