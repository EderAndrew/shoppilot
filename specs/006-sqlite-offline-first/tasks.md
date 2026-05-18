# Tasks: Banco Local SQLite e Modo Offline-First

**Input**: Design documents from `/specs/006-sqlite-offline-first/`  
**Branch**: `006-sqlite-offline-first`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

**Tests**: Incluídos para comportamentos de domínio, limites de segurança por `user_id`, e operações de persistência (SQLite CRUD e sync) — requisito constitucional para esta feature.

**Organization**: Tarefas agrupadas por user story para permitir implementação e teste independentes por story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências em tarefas incompletas)
- **[Story]**: User story correspondente (US1–US5)
- Paths completos incluídos em todas as tarefas

## Path Conventions

```
apps/mobile/src/lib/db/                   # SQLite: banco, migrations, schema
apps/mobile/src/infrastructure/local/     # Repositórios SQLite + LocalFirst
apps/mobile/src/infrastructure/repositories/  # Supabase (apenas defaultRepositories muda)
apps/mobile/src/application/ports/        # Interfaces de repositório (extensão mínima)
apps/mobile/src/features/shopping-list/   # Hooks e componentes de listas
apps/mobile/src/features/shopping-list-items/  # Hooks e componentes de itens
apps/mobile/src/shared/providers/         # AppProviders (adiciona SQLiteProvider)
apps/mobile/src/shared/ui/               # Componentes UI compartilhados
apps/mobile/tests/unit/infrastructure/   # Testes unitários dos novos repositórios
apps/mobile/tests/security/              # Testes de isolamento por user_id
```

---

## Phase 1: Setup

**Purpose**: Instalar dependências e verificar o ambiente antes de qualquer implementação.

- [x] T001 Verificar que `expo-sqlite` v16.0.10 está em `apps/mobile/package.json` (já instalado — confirmar e seguir)
- [x] T002 Instalar `expo-network` executando `pnpm --filter mobile add expo-network` em `apps/mobile/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura SQLite completa — DEVE ser concluída antes de qualquer user story.

**⚠️ CRÍTICO**: Nenhuma user story pode começar até que esta fase esteja completa.

- [x] T003 [P] Criar `apps/mobile/src/lib/db/schema.ts` com as strings SQL `CREATE TABLE IF NOT EXISTS` para `_local_migrations`, `local_shopping_lists` e `local_shopping_list_items`, e `CREATE INDEX IF NOT EXISTS` para todos os índices listados em `data-model.md`
- [x] T004 [P] Criar `apps/mobile/src/lib/db/migrations.ts` com o array de migrations (`version: 1, name: 'create_local_tables', up(db)`) e a função `runMigrations(db)` que: cria `_local_migrations` se não existir, busca `max(version)`, executa migrations pendentes, registra cada migration executada
- [x] T005 Criar `apps/mobile/src/lib/db/database.ts` que exporta `LocalDatabase` (tipo alias de `SQLiteDatabase` do expo-sqlite) e a função `initDatabase(db: LocalDatabase): Promise<void>` que chama `runMigrations` — sem singleton; a instância é gerenciada pelo `SQLiteProvider`
- [x] T006 Modificar `apps/mobile/src/shared/providers/AppProviders.tsx` para envolver o app com `<SQLiteProvider databaseName="shoppilot.db" onInit={initDatabase}>` do `expo-sqlite`, antes do `QueryClientProvider`, garantindo que o banco está pronto antes de qualquer render de dados
- [x] T007 [P] Criar `apps/mobile/src/infrastructure/local/sync.types.ts` exportando `SyncStatus` como const object e tipo: `synced | pending_create | pending_update | pending_delete | error`
- [x] T008 [P] Modificar `apps/mobile/src/application/ports/ShoppingListItemRepository.ts` para adicionar `syncStatus?: SyncStatus` opcional em `ShoppingListItemRecord` — import de `sync.types.ts`
- [x] T009 [P] Modificar `apps/mobile/src/application/ports/ShoppingListRepository.ts` para adicionar `syncStatus?: SyncStatus` opcional em `ShoppingListRecord`
- [x] T010 [P] Criar `apps/mobile/src/infrastructure/local/localDbMapper.ts` com funções `listRowToRecord(row): ShoppingListRecord` e `itemRowToRecord(row): ShoppingListItemRecord` que mapeiam colunas SQLite (snake_case) para tipos de porta (camelCase), populando `syncStatus`
- [x] T011 Criar `apps/mobile/src/infrastructure/local/SQLiteShoppingListRepository.ts` implementando métodos: `findAll(userId)`, `findById(id)`, `findByRemoteId(remoteId)`, `create(input, userId)`, `update(localId, fields)`, `softDelete(localId)`, `updateSyncStatus(localId, status, remoteId?)`, `upsertFromRemote(record, userId)`, `listActive(userId)`, `listArchived(userId)`, `getDetails(listId)`, `deleteAllForUser(userId)` — todos usando `useSQLiteContext()` do expo-sqlite
- [x] T012 Criar `apps/mobile/src/infrastructure/local/SQLiteShoppingListItemRepository.ts` implementando métodos: `findByListId(listId)` (exclui `deleted_at` não nulo), `findById(id)`, `findByRemoteId(remoteId)`, `create(input, userId)`, `update(localId, fields)`, `softDelete(localId)`, `hardDelete(localId)`, `updateSyncStatus(localId, status, remoteId?)`, `countPendingSync(userId)`, `upsertFromRemote(record, userId, localListId)`, `deleteAllForUser(userId)`
- [x] T013 Criar `apps/mobile/src/infrastructure/local/networkService.ts` exportando `isConnected(): Promise<boolean>` usando `Network.getNetworkStateAsync()` do `expo-network`, com fallback `true` em caso de erro (fail-open para evitar bloquear operações locais)

**Checkpoint**: Banco SQLite criado, migrations executadas, repositórios locais funcionais, tipos definidos. App deve abrir sem erro — funcionalidades da Fase 1 intactas.

---

## Phase 3: User Story 1 — Adição de Item Instantânea (Priority: P1) 🎯 MVP

**Goal**: Criar item salva no SQLite e aparece na UI em < 300ms. Supabase sincroniza em background sem bloquear a tela.

**Independent Test**: Com modo avião ativo, abrir uma lista e adicionar um item. O item deve aparecer imediatamente e persistir após fechar e reabrir o app.

### Tests para User Story 1 ⚠️

> **Escrever ANTES da implementação — garantir que FALHAM primeiro**

- [x] T014 [P] [US1] Escrever teste unitário em `apps/mobile/tests/unit/infrastructure/SQLiteShoppingListItemRepository.test.ts`: `create()` salva item com `sync_status = 'pending_create'` e sem `remote_id`; `updateSyncStatus()` atualiza corretamente para `synced` com `remote_id` preenchido
- [x] T015 [P] [US1] Escrever teste de segurança em `apps/mobile/tests/security/local-data-isolation.test.ts`: dados criados com `user_id = 'A'` não são retornados por queries com `user_id = 'B'`; `findByListId` retorna apenas itens do usuário correto

### Implementation para User Story 1

- [x] T016 [US1] Criar `apps/mobile/src/infrastructure/local/LocalFirstShoppingListItemRepository.ts` implementando o port `ShoppingListItemRepository` — método `add()`: (1) chama `SQLiteShoppingListItemRepository.create()` com `syncStatus: 'pending_create'`, (2) retorna o registro local imediatamente, (3) chama `void this.syncCreate(localRecord, input)` (fire-and-forget)
- [x] T017 [US1] Implementar `syncCreate(localRecord, input)` privado em `LocalFirstShoppingListItemRepository.ts`: verifica `isConnected()`, chama `SupabaseShoppingListItemRepository.add(input)`, em sucesso chama `SQLiteRepo.updateSyncStatus(localId, 'synced', remote.id)` e invalida TanStack Query cache com `queryKeys.shoppingLists.items(listId)`, em erro chama `SQLiteRepo.updateSyncStatus(localId, 'error')` e loga via `logger.warn`
- [x] T018 [US1] Criar `apps/mobile/src/infrastructure/local/LocalFirstShoppingListRepository.ts` implementando o port `ShoppingListRepository` — método `getDetails(listId)`: lê do `SQLiteShoppingListRepository.getDetails(listId)` e retorna imediatamente (para que `AddShoppingListItem` use-case possa checar `status === 'archived'` offline)
- [x] T019 [US1] Modificar `apps/mobile/src/infrastructure/repositories/defaultRepositories.ts` para importar `LocalFirstShoppingListItemRepository` e `LocalFirstShoppingListRepository` e usá-los no lugar dos Supabase diretos — injetar as dependências: `SQLiteRepo`, `SupabaseRepo`, `auth`, `network`
- [x] T020 [US1] Modificar `apps/mobile/src/features/shopping-list-items/item.queries.ts` — `useAddShoppingListItemMutation`: substituir `onSuccess: invalidateList` por `onMutate` ou manter invalidação após mutação local (a mutação agora retorna rápido); garantir que a query key `queryKeys.shoppingLists.items(listId)` usa `queryFn` que lê do SQLite via `LocalFirstRepo.getDetails()`
- [x] T021 [US1] Verificar que `apps/mobile/src/features/shopping-list-items/ShoppingListItemForm.tsx` limpa o formulário e navega de volta após `onSuccess` da mutation (sem esperar Supabase — a mutation já retorna local)

**Checkpoint**: US1 completa. Adicionar item com e sem internet funciona e é instantâneo.

---

## Phase 4: User Story 2 — Edição de Item Instantânea (Priority: P2)

**Goal**: Editar item salva no SQLite e reflete na UI em < 300ms. `sync_status` atualizado corretamente conforme existência de `remote_id`.

**Independent Test**: Com modo avião, editar nome e preço de um item existente. Mudança deve aparecer imediatamente e persistir após reiniciar o app.

### Tests para User Story 2 ⚠️

- [x] T022 [P] [US2] Adicionar casos em `apps/mobile/tests/unit/infrastructure/SQLiteShoppingListItemRepository.test.ts`: `update()` em item com `remote_id` define `sync_status = 'pending_update'`; `update()` em item sem `remote_id` mantém `sync_status = 'pending_create'`

### Implementation para User Story 2

- [x] T023 [US2] Implementar método `update()` em `LocalFirstShoppingListItemRepository.ts`: (1) lê item atual do SQLite para checar `remote_id`, (2) define `newSyncStatus = remoteId ? 'pending_update' : 'pending_create'`, (3) chama `SQLiteRepo.update(localId, { ...fields, syncStatus: newSyncStatus })`, (4) retorna registro atualizado, (5) chama `void this.syncUpdate(localRecord, input)` se tiver `remote_id`
- [x] T024 [US2] Implementar `syncUpdate(localRecord, input)` privado em `LocalFirstShoppingListItemRepository.ts`: verifica `isConnected()`, chama `SupabaseShoppingListItemRepository.update({ itemId: localRecord.remoteId, ...input })`, em sucesso chama `SQLiteRepo.updateSyncStatus(localId, 'synced')` e invalida cache TQ, em erro loga e mantém `pending_update`
- [x] T025 [US2] Verificar que `apps/mobile/src/app/(app)/(tabs)/lists/[listId]/item-[id].tsx` (tela de edição) navega de volta imediatamente após `onSuccess` da `useUpdateShoppingListItemMutation` — a mutation retorna local rápido

**Checkpoint**: US1 e US2 funcionam independentemente. Adicionar e editar são instantâneos.

---

## Phase 5: User Story 3 — Leitura Offline ao Reabrir o App (Priority: P2)

**Goal**: Ao reabrir o app sem internet, listas e itens carregam do SQLite em < 1s.

**Independent Test**: Usar app com internet, fechar, ativar modo avião, reabrir. Todas as listas e seus itens devem aparecer sem mensagem de erro de rede.

### Tests para User Story 3 ⚠️

- [x] T026 [P] [US3] Escrever teste unitário em `apps/mobile/tests/unit/infrastructure/LocalFirstShoppingListRepository.test.ts`: `getDetails()` retorna dados do SQLite quando Supabase está inacessível
- [x] T027 [P] [US3] Adicionar caso em `apps/mobile/tests/unit/infrastructure/SQLiteShoppingListItemRepository.test.ts`: `upsertFromRemote()` não sobrescreve item com `sync_status !== 'synced'`

### Implementation para User Story 3

- [x] T028 [US3] Completar `LocalFirstShoppingListRepository.ts` com métodos `list(userId)`, `listActive(userId)`, `listArchived(userId)` lendo do SQLite; e método `archive()`, `complete()`, `create()` seguindo padrão local-first (similar ao de itens)
- [x] T029 [US3] Atualizar `apps/mobile/src/features/shopping-list/shoppingList.queries.ts` — `queryFn` de `useActiveShoppingListsQuery`, `useArchivedShoppingListsQuery` e `useShoppingListDetailsQuery` passam a ler do SQLite via `LocalFirstRepo` (já wired em `defaultRepositories`)
- [x] T030 [US3] Adicionar `useHydrateListFromRemote(listId: string)` em `apps/mobile/src/features/shopping-list/shoppingList.queries.ts`: busca detalhes do Supabase via `SupabaseShoppingListRepository.getDetails()`, faz upsert seguro no SQLite, invalida cache TQ; retorna `{ isHydrating, error }`
- [x] T031 [US3] Adicionar `useEffect(() => { hydrateList(listId) }, [listId])` na tela de detalhe da lista `apps/mobile/src/app/(app)/(tabs)/lists/[listId]/index.tsx` (ou o arquivo real da tela de detalhe), importando `useHydrateListFromRemote`
- [x] T032 [US3] Implementar `upsertFromRemote(record, userId, localListId)` em `SQLiteShoppingListItemRepository.ts`: se existir item local com mesmo `remote_id` e `sync_status !== 'synced'`, retornar sem sobrescrever; caso contrário, fazer upsert com `sync_status = 'synced'`

**Checkpoint**: App funciona offline. Listas e itens carregam do SQLite sem depender do Supabase.

---

## Phase 6: User Story 4 — Remoção Segura de Item (Priority: P3)

**Goal**: Remover item aplica soft delete local imediatamente. Item some da UI. Sync remoto em background.

**Independent Test**: Com modo avião, remover um item. Deve sumir imediatamente e permanecer ausente após reiniciar o app.

### Tests para User Story 4 ⚠️

- [x] T033 [P] [US4] Adicionar casos em `apps/mobile/tests/unit/infrastructure/SQLiteShoppingListItemRepository.test.ts`: `softDelete()` define `deleted_at` e `sync_status = 'pending_delete'`; `findByListId()` não retorna itens com `deleted_at` preenchido; `hardDelete()` remove o registro completamente
- [x] T034 [P] [US4] Adicionar caso em `apps/mobile/tests/unit/infrastructure/LocalFirstShoppingListItemRepository.test.ts`: item sem `remote_id` é hard-deleted localmente; item com `remote_id` recebe soft delete + `pending_delete`

### Implementation para User Story 4

- [x] T035 [US4] Implementar método `remove(itemId)` em `LocalFirstShoppingListItemRepository.ts`: (1) lê item atual do SQLite para checar `remote_id`, (2a) se sem `remote_id`: chama `SQLiteRepo.hardDelete(localId)` e retorna, (2b) se com `remote_id`: chama `SQLiteRepo.softDelete(localId)` definindo `deleted_at` + `sync_status: 'pending_delete'`, (3) retorna, (4) chama `void this.syncDelete(remoteId, localId)` se houver `remote_id`
- [x] T036 [US4] Implementar `syncDelete(remoteId, localId)` privado em `LocalFirstShoppingListItemRepository.ts`: verifica `isConnected()`, chama `SupabaseShoppingListItemRepository.remove(remoteId)`, em sucesso chama `hardDelete` para limpar SQLite, em erro loga e mantém `pending_delete`
- [x] T037 [US4] Verificar que `upsertFromRemote()` em `SQLiteShoppingListItemRepository.ts` nunca reintroduz item com `deleted_at` preenchido — busca por `remote_id` sem filtro e checa `existing.deleted_at !== null` explicitamente

**Checkpoint**: US1–US4 funcionam independentemente. Todas as operações CRUD são instantâneas.

---

## Phase 7: User Story 5 — Indicador de Sincronização Pendente (Priority: P3)

**Goal**: UI mostra discretamente quando há itens pendentes de sync. Badge some após sincronização.

**Independent Test**: Criar itens com modo avião. Indicador de pendência aparece. Reativar internet e aguardar sync. Indicador desaparece.

### Implementation para User Story 5

- [x] T038 [US5] Adicionar `usePendingSyncCountQuery(userId: string)` em `apps/mobile/src/features/shopping-list-items/item.queries.ts`: `queryFn` chama `SQLiteShoppingListItemRepository.countPendingSync(userId)`, `queryKey: queryKeys.shoppingLists.pendingCount(userId)` (adicionar nova key em `queryKeys.ts`)
- [x] T039 [US5] Criar `apps/mobile/src/shared/ui/SyncStatusBadge.tsx` — componente Tamagui discreto que exibe texto "Pendente" (XS Text, cor neutra) quando `syncStatus !== 'synced'` e `syncStatus !== undefined`; nenhum output quando `synced`
- [x] T040 [US5] Modificar `apps/mobile/src/features/shopping-list-items/ShoppingListItemRow.tsx` para exibir `<SyncStatusBadge syncStatus={item.syncStatus} />` discretamente ao lado do nome ou preço do item
- [x] T041 [US5] Adicionar indicador global na tela de detalhe da lista (onde `useShoppingListDetailsQuery` é consumido): se `pendingCount > 0`, exibir texto discreto "X itens pendentes de sincronização" usando `usePendingSyncCountQuery`
- [x] T042 [US5] Adicionar `clearLocalDataOnLogout(userId)` em `apps/mobile/src/features/auth/auth.queries.ts` — `useLogoutMutation.onSuccess`: chama `SQLiteShoppingListRepository.deleteAllForUser(userId)` e `SQLiteShoppingListItemRepository.deleteAllForUser(userId)` antes de navegar para login

**Checkpoint**: Todas as 5 user stories completas e testáveis independentemente.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Qualidade, validação de regressão, e preparação para Fase 3.

- [x] T043 Verificar que lista arquivada bloqueia adicionar/editar/remover offline: o use case `AddShoppingListItem` checa `status === 'archived'` via `LocalFirstShoppingListRepository.getDetails()` — testar manualmente abrindo lista arquivada sem internet e tentando adicionar item
- [x] T044 [P] Adicionar tratamento de erro SQLite em `SQLiteShoppingListItemRepository.ts` e `SQLiteShoppingListRepository.ts`: envolver operações de escrita em try/catch, mapear para `AppError` via `createAppError({ category: 'unexpected' })` do `apps/mobile/src/shared/errors/appError.ts`, logar com `logger.error`
- [x] T045 [P] Verificar que erros de Supabase nos métodos `syncCreate/syncUpdate/syncDelete` nunca propagam para a UI — devem ser capturados internamente, logados com `logger.warn`, e o item permanecer com `sync_status = 'error'` sem lançar exceção
- [x] T046 Rodar `pnpm typecheck` a partir da raiz do monorepo e corrigir todos os erros TypeScript introduzidos na Fase 2
- [x] T047 Rodar `pnpm lint` a partir da raiz do monorepo e corrigir todos os erros de lint introduzidos na Fase 2
- [x] T048 Rodar `pnpm --filter mobile test` e corrigir qualquer falha nos testes existentes causada pelas mudanças da Fase 2
- [x] T049 Teste manual de regressão: verificar que sessão persistente (Fase 1), edição de produto, campo marca, bloqueio em listas arquivadas e versionamento do app continuam funcionando após as mudanças
- [x] T050 Teste manual do fluxo completo: (1) criar item offline → fechar app → abrir offline → item aparece; (2) reativar internet → sync acontece → `sync_status` muda para `synced` → badge desaparece
- [x] T051 Rodar `pnpm mobile:start` e testar no simulador iOS/Android os cenários de `quickstart.md`
- [x] T052 [P] Registrar decisões técnicas da Fase 2 em `specs/006-sqlite-offline-first/plan.md` — seção de notas: uso de `globalThis.crypto.randomUUID()`, padrão fire-and-forget para sync, motivo de manter `price_history` e `user_events` apenas remotos, lista de items para a Fase 3 (retry robusto, reconciliação bidirecional, resolução de conflitos, limpeza de soft-deletes antigos)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Nenhuma — pode começar imediatamente
- **Foundational (Phase 2)**: Depende do Setup — **BLOQUEIA todas as user stories**
- **US1 (Phase 3)**: Depende do Foundational — é o MVP, implementar primeiro
- **US2 (Phase 4)**: Depende do Foundational; depende parcialmente de US1 (LocalFirstRepo já existe)
- **US3 (Phase 5)**: Depende do Foundational; independente de US1/US2 conceitualmente, mas na prática LocalFirstRepo já existe após US1
- **US4 (Phase 6)**: Depende do Foundational; LocalFirstRepo.remove() adiciona ao mesmo arquivo de US1
- **US5 (Phase 7)**: Depende do Foundational e dos repositórios SQLite (Phase 2); independente das stories 1–4
- **Polish (Phase 8)**: Depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: Pode começar após Phase 2 — nenhuma dependência de outras stories
- **US2 (P2)**: Pode começar após Phase 2 — adiciona `update()` ao LocalFirst criado em US1
- **US3 (P2)**: Pode começar após Phase 2 — leitura é independente das mutations de US1/US2
- **US4 (P3)**: Pode começar após Phase 2 — adiciona `remove()` ao LocalFirst criado em US1
- **US5 (P3)**: Pode começar após Phase 2 — badge UI é independente; `clearOnLogout` é standalone

### Within Each User Story

- Escrever e verificar falha dos testes ANTES de implementar
- Tipos e mappers (Phase 2) antes de repositórios
- Repositórios locais antes de repositórios LocalFirst
- LocalFirst antes de wiring em `defaultRepositories.ts`
- Wiring antes de ajustes nos hooks/UI

### Parallel Opportunities

- T003, T004 (Phase 2): Schema e migrations são independentes entre si
- T007, T008, T009, T010 (Phase 2): Podem rodar em paralelo
- T011, T012, T013 (Phase 2): SQLiteListRepo, SQLiteItemRepo, networkService são independentes
- T014, T015 (US1 tests): Podem ser escritos em paralelo
- T022 (US2 test) e T026, T027 (US3 tests) e T033, T034 (US4 tests): Todos paralelos após Phase 2
- T044, T045 (Polish): Arquivos diferentes, podem rodar em paralelo

---

## Parallel Example: Foundational Phase

```bash
# Grupo 1 (paralelo):
Task T003: "Criar schema.ts com CREATE TABLE SQL"
Task T004: "Criar migrations.ts com runner"

# Grupo 2 (após T003+T004):
Task T005: "Criar database.ts com initDatabase()"
Task T007: "Criar sync.types.ts com SyncStatus"
Task T008: "Adicionar syncStatus? em ShoppingListItemRepository.ts"
Task T009: "Adicionar syncStatus? em ShoppingListRepository.ts"
Task T010: "Criar localDbMapper.ts com row→record funções"

# Sequencial (após Grupo 2):
Task T006: "Modificar AppProviders.tsx com SQLiteProvider"
Task T011: "Criar SQLiteShoppingListRepository.ts"
Task T012: "Criar SQLiteShoppingListItemRepository.ts"
Task T013: "Criar networkService.ts"
```

## Parallel Example: User Story 1

```bash
# Paralelo (escrever e verificar falha):
Task T014: "Teste unitário SQLiteShoppingListItemRepository"
Task T015: "Teste de segurança local-data-isolation"

# Sequencial (implementação):
Task T016: "LocalFirstShoppingListItemRepository.add() + backgroundSync"
Task T017: "syncCreate() privado no LocalFirst"
Task T018: "LocalFirstShoppingListRepository.getDetails()"
Task T019: "Atualizar defaultRepositories.ts"
Task T020: "Ajustar item.queries.ts"
Task T021: "Verificar ShoppingListItemForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001–T002)
2. Completar Phase 2: Foundational (T003–T013) — **crítico, não pular**
3. Completar Phase 3: User Story 1 (T014–T021)
4. **PARAR E VALIDAR**: Adicionar item com e sem internet é instantâneo?
5. Rodar T046–T048 (typecheck, lint, tests)

### Incremental Delivery

1. Setup + Foundational → banco local funciona
2. US1 → adição instantânea → **MVP da Fase 2!**
3. US2 → edição instantânea
4. US3 → leitura offline completa
5. US4 → remoção segura
6. US5 → indicador visual de pendência
7. Polish → qualidade, regressão, documentação

### Parallel Team Strategy

Com dois desenvolvedores após Phase 2:
- **Dev A**: US1 (T014–T021) → US2 (T022–T025) → US4 (T033–T037)
- **Dev B**: US3 (T026–T032) → US5 (T038–T042) → Polish (T043–T052)

---

## Notes

- Antes de cada tarefa de implementação, verificar que o typecheck passa: `pnpm typecheck`
- `[P]` = arquivos diferentes, sem dependências em tasks incompletas da mesma fase
- Cada user story deve ser testável independentemente antes de avançar
- Commits frequentes após cada task ou grupo lógico
- Nenhum componente de UI deve importar `expo-sqlite` diretamente — sempre via repositórios
- `price_history` e `user_events` continuam sendo escritos apenas no Supabase nesta fase
- Sync completo bidirecional, retry automático e resolução de conflitos são escopo da Fase 3
