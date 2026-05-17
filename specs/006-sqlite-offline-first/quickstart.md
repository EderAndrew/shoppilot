# Quickstart: Banco Local SQLite e Modo Offline-First

**Branch**: `006-sqlite-offline-first`  
**Date**: 2026-05-17

## Como implementar esta feature

### Pré-requisitos

```bash
# Verificar branch
git branch --show-current  # deve ser 006-sqlite-offline-first

# Instalar expo-network (única dependência nova)
cd apps/mobile && pnpm add expo-network

# Verificar que expo-sqlite já está instalado
cat package.json | grep expo-sqlite  # deve aparecer ~16.0.10
```

### Ordem de implementação

Seguir as 7 etapas do `plan.md` em ordem. Cada etapa é independente e pode ser validada antes de prosseguir.

**Etapa 1** — Fundação SQLite (arquivos novos, sem modificar código existente)
```
src/lib/db/schema.ts
src/lib/db/migrations.ts
src/lib/db/database.ts
src/shared/providers/AppProviders.tsx  ← adicionar SQLiteProvider
```

**Etapa 2** — Repositórios SQLite
```
src/infrastructure/local/sync.types.ts
src/infrastructure/local/localDbMapper.ts
src/infrastructure/local/SQLiteShoppingListRepository.ts
src/infrastructure/local/SQLiteShoppingListItemRepository.ts
```

**Etapa 3** — Orquestração LocalFirst + wiring
```
src/infrastructure/local/LocalFirstShoppingListItemRepository.ts
src/infrastructure/local/LocalFirstShoppingListRepository.ts
src/infrastructure/local/networkService.ts
src/infrastructure/repositories/defaultRepositories.ts  ← trocar repositórios
```

**Etapas 4–7** — UI + indicadores + logout + qualidade

### Validação rápida após Etapa 1

```bash
pnpm mobile:start
# Abrir app → não deve ter erro de banco
# No Expo DevTools, verificar que "shoppilot.db" foi criado sem erros
```

### Validação rápida após Etapa 3

```bash
# Com internet:
# 1. Abrir uma lista
# 2. Adicionar item → deve aparecer imediatamente
# 3. Verificar no Supabase Studio que item apareceu (pode ter delay de segundos)

# Sem internet (modo avião):
# 1. Adicionar item → deve aparecer imediatamente
# 2. Fechar e abrir app → item ainda aparece
```

### Arquivos-chave do código existente

| Arquivo | O que faz | Relevância para Fase 2 |
|---------|-----------|------------------------|
| `src/application/ports/ShoppingListItemRepository.ts` | Port interface de itens | Adicionar `syncStatus?` opcional |
| `src/application/use-cases/shoppingListItems.ts` | Lógica de negócio (não muda) | Entender fluxo atual |
| `src/features/shopping-list-items/item.queries.ts` | Hooks TanStack Query | Adicionar `usePendingSyncCountQuery` |
| `src/infrastructure/repositories/defaultRepositories.ts` | DI container | Trocar repositórios Supabase por LocalFirst |
| `src/shared/providers/AppProviders.tsx` | Providers raiz | Adicionar `SQLiteProvider` |

### Tipos de dados importantes

```ts
// sync.types.ts
export type SyncStatus = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete' | 'error'

// Regra de sincronização para edição de item
function getSyncStatusAfterEdit(item: LocalItem): SyncStatus {
  if (!item.remote_id) return 'pending_create'  // nunca foi sincronizado
  return 'pending_update'
}

// Regra de sincronização para remoção
function getSyncStatusAfterDelete(item: LocalItem): 'hard_delete' | 'pending_delete' {
  if (!item.remote_id) return 'hard_delete'  // nunca foi ao Supabase
  return 'pending_delete'
}
```

### Padrão de background sync

```ts
// Todas as operações de escrita seguem este padrão
async function localFirstWrite<T>(
  localWrite: () => Promise<T>,
  remoteSync: (result: T) => Promise<void>,
): Promise<T> {
  const result = await localWrite()      // rápido, retorna imediatamente
  void remoteSync(result)                // fire-and-forget, não bloqueia
  return result
}
```

### Onde NÃO fazer mudanças

- `src/domain/` — nenhum arquivo de domínio muda
- `src/application/use-cases/` — nenhum use case muda
- `src/infrastructure/repositories/Supabase*.ts` — repositórios Supabase não mudam
- Tabelas remotas do Supabase — nenhuma migration remota necessária

### Testes

```bash
# Rodar todos os testes
pnpm --filter mobile test

# Rodar apenas testes de infrastructure local (após criação)
pnpm --filter mobile test tests/unit/infrastructure/SQLite

# Typecheck
pnpm typecheck

# Lint
pnpm lint
```
