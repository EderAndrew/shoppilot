# Research: Banco Local SQLite e Modo Offline-First

**Feature**: 006-sqlite-offline-first  
**Phase**: 0 — Research  
**Date**: 2026-05-17

## Decision Log

---

### D-001: expo-sqlite já está instalado — nenhuma instalação necessária

**Decision**: Usar `expo-sqlite` v16.0.10 (já em `apps/mobile/package.json`).

**Rationale**: A dependência já existe. expo-sqlite v16 fornece `SQLiteProvider`, `useSQLiteContext()`, e `openDatabaseAsync()` — API moderna assíncrona com suporte a migrations e transações. Também há `sqlite` v5.1.1 (Node.js), que não é usada no mobile — ignorar.

**Alternatives considered**: `react-native-sqlite-storage` — não necessário, expo-sqlite é a solução oficial para projetos Expo.

**Implication for plan**: Pular etapa de instalação. Focar em configuração e wiring.

---

### D-002: API expo-sqlite v16 — padrão `SQLiteProvider` + `openDatabaseAsync`

**Decision**: Usar `SQLiteProvider` no root layout como ponto único de inicialização do banco. Repositórios locais usam `useSQLiteContext()` ou recebem a instância via injeção de dependência.

**Rationale**: `SQLiteProvider` garante que o banco está pronto antes de qualquer componente filho renderizar. Sua prop `onInit` executa migrations de forma síncrona antes de liberar a UI. API principal de uso:
```ts
// Abertura
const db = await SQLite.openDatabaseAsync('shoppilot.db')
// Leitura
const rows = await db.getAllAsync<T>('SELECT * FROM t WHERE id = ?', [id])
// Escrita
await db.runAsync('INSERT INTO t (id, name) VALUES (?, ?)', [id, name])
// Transação
await db.withTransactionAsync(async () => { ... })
```

**Alternatives considered**: `openDatabaseAsync` imperativo no `AppProviders.tsx` — viável mas `SQLiteProvider` é mais idiomático e integra melhor com React lifecycle.

---

### D-003: UUID para IDs locais — `expo-crypto` ou `globalThis.crypto`

**Decision**: Usar `globalThis.crypto.randomUUID()` disponível a partir do React Native 0.73+ (projeto usa RN 0.81.5). Se falhar em algum ambiente, fallback para `expo-crypto` (já disponível no SDK 54 sem instalação adicional) via `Crypto.randomUUID()`.

**Rationale**: `globalThis.crypto.randomUUID()` é nativo no RN moderno, sem dependência adicional. O projeto já usa Expo SDK 54, que disponibiliza `expo-crypto` no runtime sem adicionar ao package.json.

**Alternatives considered**: Pacote `uuid` npm — adiciona dependência desnecessária. `Math.random()` — não é criptograficamente seguro para IDs de entidade.

---

### D-004: Detecção de conectividade — `expo-network` (instalação necessária)

**Decision**: Instalar `expo-network` e usar `Network.getNetworkStateAsync()` para checar conectividade antes de tentar sync remoto.

**Rationale**: `expo-network` não está no package.json atual. É o pacote oficial do Expo para estado de rede, sem dependências nativas extras além do SDK. Alternativa `@react-native-community/netinfo` também não está instalada — manter dependências no ecossistema Expo é preferível.

**Alternatives considered**: `fetch` simples como probe — frágil e lento. `NetInfo` — funciona mas adiciona dependência fora do ecossistema Expo.

**API de uso**:
```ts
import * as Network from 'expo-network'
const { isConnected } = await Network.getNetworkStateAsync()
```

---

### D-005: Estratégia de migrations locais — tabela `_local_migrations` + versão incremental

**Decision**: Criar tabela `_local_migrations (version INTEGER PRIMARY KEY, name TEXT, applied_at TEXT)`. Cada migration é um objeto com `version: number` e `up(db): Promise<void>`. O runner executa todas as migrations com `version > max(version em tabela)`.

**Rationale**: Simples, sem dependência externa, idempotente, suporta evolução do schema ao longo de múltiplas versões do app.

**Alternatives considered**: Drizzle ORM / Prisma — overkill para esta fase; adiciona compilação, geração de tipos, e configuração de build. Versão por pragma `PRAGMA user_version` — viável mas menos expressivo que tabela própria.

---

### D-006: Padrão local-first para repositórios — `LocalFirst*Repository` que implementa os ports existentes

**Decision**: Criar `LocalFirstShoppingListItemRepository` e `LocalFirstShoppingListRepository` que implementam exatamente os mesmos ports (`ShoppingListItemRepository`, `ShoppingListRepository`). Esses `LocalFirst*` repositórios:
1. Escrevem no SQLite e retornam imediatamente
2. Disparam sync assíncrono com Supabase em background (fire-and-forget)
3. Leituras preferem SQLite; hidratação remota acontece em paralelo

**Rationale**: Os ports existentes não mudam. Os use cases existentes não mudam. A troca é feita apenas em `defaultRepositories.ts`. Isso é 100% compatível com a constitution (Backend-ready por Abstração).

**Alternatives considered**: Modificar os `SupabaseShoppingList*Repository` diretamente — acoplaria SQLite em código Supabase, violando SRP. Criar novos ports — quebraria use cases existentes. Adicionar camada de "service" entre use-case e repositório — adiciona complexidade sem necessidade, pois os ports já são a abstração certa.

---

### D-007: Sincronização após escrita local — `void` (fire-and-forget) nesta fase

**Decision**: Após escrita local, chamar `supabaseRepo.add()/update()/remove()` com `void` (não-aguardado). Se bem-sucedido, atualizar `remote_id` e `sync_status` no SQLite e invalidar TanStack Query. Se falhar, marcar `sync_status = 'error'` e logar.

**Rationale**: Fase 2 não requer fila de sync robusta. Fire-and-forget é suficiente para o escopo: se o app fecha antes do sync, o item permanece `pending_create`/`pending_update`/`pending_delete` no SQLite e será re-tentado na Fase 3.

**Alternatives considered**: `@tanstack/react-query` `useMutation` com retry — possível mas a lógica de retry pertence ao repositório/service, não à camada UI. Background task do Expo — fora do escopo desta fase.

---

### D-008: `sync_status` — exposto via tipo estendido, não via port separado

**Decision**: Estender `ShoppingListItemRecord` com `syncStatus?: SyncStatus` opcional. Implementações Supabase existentes não populam o campo (fica `undefined`, interpretado como `synced`). Repositórios SQLite populam sempre. Isso evita criar novo port ou nova abstração.

**Rationale**: Campo opcional não quebra o contrato existente. Use cases existentes não dependem de `syncStatus`. O campo é consumido apenas na camada de UI (indicador visual).

**Alternatives considered**: Novo port `LocalItemRepository` — duplicaria a abstração. Zustand para sync status — state manager de UI não deve armazenar estado de persistência crítico.

---

### D-009: Leitura da UI — SQLite como `queryFn` principal, hidratação Supabase como efeito separado

**Decision**: As queries TanStack Query (`useShoppingListDetailsQuery`, etc.) terão `queryFn` lendo do SQLite via `LocalFirst*Repository.getDetails()`. Um hook separado `useHydrateListFromRemote(listId)` busca dados do Supabase em background, faz upsert no SQLite e invalida o cache TQ. Esse hook é chamado como `useEffect` na tela de detalhe da lista.

**Rationale**: Separação limpa entre leitura local (fast path) e hidratação remota (background). A UI não bloqueia em Supabase. A invalidação do TQ cache após hidratação causa re-render com dados frescos — sem loops porque `staleTime` adequado evita re-fetches infinitos.

**Alternatives considered**: `queryFn` que faz tudo (SQLite + Supabase) — mistura responsabilidades e pode tornar a query lenta. `staleWhileRevalidate` pattern puro com Supabase — requer conectividade para primeiro render offline.

---

### D-010: Wiring — `defaultRepositories.ts` atualizado para local-first, mas sem perder Supabase

**Decision**: Criar `localRepositories.ts` ao lado de `defaultRepositories.ts`. O `localRepositories.ts` exporta os `LocalFirst*` repositórios, cada um recebendo o repositório Supabase correspondente como dependência de sync. `defaultRepositories.ts` passa a importar de `localRepositories.ts`.

**Rationale**: Isola o wiring local-first em um arquivo dedicado. Fácil de reverter ou extend para Fase 3. `defaultRepositories.ts` continua sendo o único ponto de entrada para use cases.

---

### D-011: Inicialização SQLite — `<SQLiteProvider>` em `AppProviders.tsx`

**Decision**: Adicionar `<SQLiteProvider databaseName="shoppilot.db" onInit={runMigrations}>` dentro de `AppProviders.tsx`, antes do `QueryClientProvider`. A prop `onInit` executa as migrations de forma síncrona (bloqueia renderização apenas do banco, não da UI principal pois é async suspense).

**Rationale**: Garante que o banco está pronto para qualquer componente filho. `onInit` é assíncrono e não bloqueia a UI — `SQLiteProvider` usa Suspense internamente no expo-sqlite v16.

**Alternatives considered**: Inicializar no `RootLayout._layout.tsx` — viável, mas `AppProviders` já agrega todos os providers, é o lugar correto.

---

### D-012: Regra de lista arquivada — já enforced nos use-cases; aplicar também no SQLite repository

**Decision**: O check `status === 'archived'` já existe nos use cases (`shoppingListItems.ts:61,142,232`). O `LocalFirstShoppingListRepository.getDetails()` deve retornar o `status` correto do SQLite, garantindo que o use case funciona offline. Nenhuma mudança nos use cases é necessária.

**Rationale**: A regra de negócio está na camada correta (application/use-cases). O repositório local apenas precisa retornar os dados corretos.

---

### D-013: Produto precisa existir no Supabase antes de adicionar item — escopo mantido

**Decision**: O fluxo de criação de item continua exigindo seleção de produto (que requer conectividade inicial ou cache TQ). O `product_id` é armazenado localmente mas pode ser `null` para itens criados com produto novo offline (fora de escopo desta fase). Em Phase 2, o `product_id` sempre terá valor pois o produto é selecionado do cache.

**Rationale**: Modificar o fluxo de seleção de produto para offline-first está explicitamente fora do escopo da Fase 2.

---

### D-014: Indicador de pendência — hook `usePendingSyncCount()`

**Decision**: Criar `usePendingSyncCountQuery()` que lê diretamente do SQLite via um método `countPendingSync(userId): Promise<number>` no repositório local. Exibir como badge discreto na tela de detalhes da lista.

**Rationale**: Não polui o port principal. É uma query de leitura simples. TanStack Query invalida após cada mutação local, mantendo o contador atualizado.
