# Feature Specification: Banco Local SQLite e Modo Offline-First

**Feature Branch**: `006-sqlite-offline-first`  
**Created**: 2026-05-17  
**Status**: Draft  
**Input**: Fase 2 do app mobile shopPilot — performance com banco local e preparação para modo offline-first

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Adição de Item Instantânea (Priority: P1)

Quando o usuário adiciona um produto à lista de compras, o item aparece imediatamente na tela sem qualquer espera perceptível, independentemente da qualidade da conexão com a internet.

**Why this priority**: É o problema mais visível hoje — a lentidão ao salvar no servidor remoto trava a tela e frustra o usuário durante a compra. Resolver isso é o principal objetivo da Fase 2.

**Independent Test**: Pode ser testado completamente desativando o Wi-Fi do dispositivo, abrindo uma lista e adicionando um item. O item deve aparecer na tela imediatamente e permanecer visível após reabrir o app.

**Acceptance Scenarios**:

1. **Given** o usuário está em uma lista ativa com conexão estável, **When** ele adiciona um novo item, **Then** o item aparece na lista em menos de 300ms, sem bloqueio de tela, e eventualmente aparece sincronizado com o servidor remoto.
2. **Given** o usuário está sem conexão com a internet, **When** ele adiciona um novo item, **Then** o item aparece imediatamente na lista com um indicador visual de "pendente de sincronização".
3. **Given** o usuário adicionou itens enquanto offline, **When** a conexão é restaurada, **Then** os itens pendentes são sincronizados com o servidor em segundo plano sem intervenção do usuário.
4. **Given** o usuário fecha e reabre o app sem conexão, **When** a tela de lista carrega, **Then** todos os itens salvos localmente aparecem corretamente, incluindo os ainda não sincronizados.

---

### User Story 2 — Edição de Item Instantânea (Priority: P2)

Quando o usuário edita um item (nome, marca, quantidade, preço), a alteração é refletida imediatamente na tela sem espera por confirmação do servidor.

**Why this priority**: A edição frequente de itens durante uma compra — atualizar preço ao ver o produto na prateleira — deve ser tão fluida quanto anotar em papel. Qualquer latência interrompe o fluxo do usuário.

**Independent Test**: Com Wi-Fi desativado, editar o nome e o preço de um item existente. A tela deve atualizar instantaneamente e os dados devem persistir ao fechar e reabrir o app.

**Acceptance Scenarios**:

1. **Given** um item existe na lista, **When** o usuário edita qualquer campo e confirma, **Then** a tela reflete a mudança em menos de 300ms.
2. **Given** o item editado ainda não foi sincronizado com o servidor (pending_create), **When** o usuário edita esse item, **Then** o item permanece marcado como "pendente de criação" e não como "pendente de atualização".
3. **Given** o item editado já foi sincronizado, **When** o usuário edita offline, **Then** o item fica marcado como "pendente de atualização".
4. **Given** uma lista está arquivada, **When** o usuário tenta editar um item, **Then** a edição é bloqueada com mensagem clara, mesmo sem conexão.

---

### User Story 3 — Leitura Offline ao Reabrir o App (Priority: P2)

Quando o usuário reabre o app sem conexão com a internet, suas listas e itens carregam imediatamente a partir do armazenamento local, sem depender do servidor remoto.

**Why this priority**: Um app de compras precisa funcionar no supermercado onde a conexão pode ser intermitente. O usuário não pode ficar sem acesso às suas listas por causa de falhas de rede.

**Independent Test**: Usar o app com conexão, fechar completamente, ativar modo avião e reabrir. Todas as listas e itens devem aparecer sem nenhuma mensagem de erro de rede.

**Acceptance Scenarios**:

1. **Given** o usuário usou o app com conexão anteriormente, **When** ele reabre o app no modo avião, **Then** todas as listas aparecem carregadas e navegáveis.
2. **Given** o usuário navega para uma lista específica sem conexão, **When** a tela de detalhes abre, **Then** todos os itens e o total são exibidos corretamente a partir do armazenamento local.
3. **Given** o app está aberto sem conexão, **When** a conexão é restaurada, **Then** o app sincroniza os dados pendentes com o servidor de forma transparente.

---

### User Story 4 — Remoção Segura de Item (Priority: P3)

Quando o usuário remove um item da lista, o item desaparece imediatamente da tela. A remoção é registrada localmente e sincronizada com o servidor quando possível.

**Why this priority**: Remoção precisa parecer instantânea para boa experiência, mas é menos crítica do que adição e edição, que são operações mais frequentes durante uma compra.

**Independent Test**: Com Wi-Fi desativado, remover um item. O item deve sumir da tela imediatamente e continuar ausente após reabrir o app.

**Acceptance Scenarios**:

1. **Given** um item existe na lista, **When** o usuário o remove, **Then** o item desaparece da tela imediatamente.
2. **Given** o item removido já havia sido sincronizado com o servidor, **When** o usuário remove offline, **Then** a remoção fica registrada localmente como "pendente de exclusão" e é aplicada no servidor quando a conexão retornar.
3. **Given** o item removido nunca foi sincronizado (pending_create), **When** o usuário o remove, **Then** o item é eliminado do armazenamento local sem necessidade de sincronização futura.
4. **Given** uma lista está arquivada, **When** o usuário tenta remover um item, **Then** a remoção é bloqueada.

---

### User Story 5 — Indicador de Sincronização Pendente (Priority: P3)

O usuário consegue identificar, de forma discreta, quando existem dados que ainda não foram sincronizados com o servidor, para ter ciência do estado do app.

**Why this priority**: Transparência sobre o estado de sincronização evita confusão e dúvidas ("meu item foi salvo?"), mas não precisa ser proeminente — apenas discretamente visível.

**Independent Test**: Criar itens com Wi-Fi desativado. O app deve exibir algum indicador de pendência. Reativar o Wi-Fi e aguardar — o indicador deve desaparecer após a sincronização.

**Acceptance Scenarios**:

1. **Given** o usuário tem itens pendentes de sincronização, **When** visualiza a tela de lista, **Then** um indicador discreto mostra que há dados não sincronizados.
2. **Given** todos os itens estão sincronizados, **When** o usuário visualiza a tela, **Then** nenhum indicador de pendência é exibido.
3. **Given** a sincronização de um item falhou, **When** o usuário visualiza a lista, **Then** o item continua visível com indicação de erro de sincronização.

---

### Edge Cases

- O que acontece quando o usuário adiciona itens rapidamente em sequência sem conexão? Todos devem ser salvos localmente e ficarem visíveis.
- O que acontece quando a sincronização falha repetidamente para um item? O item permanece local com status de erro; nenhum dado é perdido.
- O que acontece quando o app é atualizado e o esquema local muda? As migrations locais devem ser executadas automaticamente na inicialização.
- O que acontece quando dois dispositivos do mesmo usuário modificam o mesmo item? Esta fase não resolve conflitos complexos — o servidor remoto prevalece na próxima sincronização completa (Fase 3).
- O que acontece ao tentar adicionar item em lista arquivada sem conexão? A operação é bloqueada localmente antes mesmo de tentar qualquer acesso remoto.
- O que acontece quando o armazenamento do dispositivo está cheio? O app deve tratar o erro de escrita local e informar o usuário.
- O que acontece quando o usuário tem muitos itens pendentes? A UI deve indicar a quantidade ou presença de pendências sem degradar a performance de leitura.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE salvar novos itens no armazenamento local antes de tentar qualquer comunicação com o servidor remoto.
- **FR-002**: O sistema DEVE atualizar a interface imediatamente após salvar localmente, sem aguardar confirmação remota.
- **FR-003**: O sistema DEVE manter um status de sincronização para cada item local: `synced`, `pending_create`, `pending_update`, `pending_delete` ou `error`.
- **FR-004**: O sistema DEVE inicializar o banco de dados local automaticamente na abertura do app, executando migrations versionadas pendentes.
- **FR-005**: O sistema DEVE persistir os dados locais entre sessões — itens e listas devem estar disponíveis ao reabrir o app mesmo sem conexão.
- **FR-006**: O sistema DEVE tentar sincronizar itens pendentes com o servidor remoto em segundo plano após operações locais, sem bloquear a interface.
- **FR-007**: O sistema DEVE manter itens com falha de sincronização armazenados localmente com status `error`, sem perder os dados.
- **FR-008**: O sistema DEVE bloquear adição, edição e remoção de itens em listas arquivadas, tanto na interface quanto na camada de repositório local.
- **FR-009**: O sistema DEVE aplicar soft delete em itens removidos (registrar `deleted_at`), não exclusão permanente imediata.
- **FR-010**: O sistema DEVE exibir indicador visual discreto quando houver itens com sincronização pendente ou com erro.
- **FR-011**: O sistema DEVE ler listas e itens preferencialmente do armazenamento local, usando o servidor remoto como fonte secundária de atualização.
- **FR-012**: O sistema DEVE, quando dados remotos estiverem disponíveis, usá-los para atualizar o armazenamento local sem duplicar registros existentes.
- **FR-013**: O sistema DEVE separar as responsabilidades de armazenamento local e acesso remoto em camadas distintas, sem lógica de sincronização diretamente nos componentes de interface.
- **FR-014**: O sistema DEVE preservar o `remote_id` associando cada registro local ao seu correspondente no servidor, quando disponível.
- **FR-015**: O sistema DEVE manter o histórico de preços e eventos de usuário intactos, sem remoção irreversível de dados relevantes.
- **FR-016**: O sistema DEVE garantir que dados de um usuário nunca sejam acessíveis por outro, tanto localmente quanto remotamente.

### Key Entities

- **Lista Local** (`local_shopping_list`): Representação local de uma lista de compras. Possui identificador local, referência ao identificador remoto quando disponível, nome, status (ativa/arquivada), data de arquivamento, status de sincronização e timestamps de criação, atualização e exclusão lógica. Espelha o conceito de `shopping_list` do servidor remoto.

- **Item Local** (`local_shopping_list_item`): Representação local de um item em uma lista. Possui identificador local, referência ao identificador remoto quando disponível, referência à lista local e à lista remota, nome do produto, marca, quantidade, preço, status de sincronização e timestamps de criação, atualização e exclusão lógica. Espelha o conceito de `shopping_list_item` do servidor remoto.

- **Status de Sincronização** (`SyncStatus`): Valor enumerado que descreve o estado de um registro em relação ao servidor remoto. Valores possíveis: `synced` (confirmado no servidor), `pending_create` (aguarda criação remota), `pending_update` (aguarda atualização remota), `pending_delete` (aguarda exclusão remota), `error` (última tentativa de sincronização falhou).

- **Migration Local**: Registro versionado de alterações no esquema do banco de dados local. Garante que atualizações do esquema sejam aplicadas de forma controlada e idempotente a cada versão do app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A adição de um item é refletida na lista em menos de 300ms após confirmação do formulário, independentemente da qualidade da conexão.
- **SC-002**: A edição de um item é refletida na tela em menos de 300ms após confirmação, sem bloquear a interação do usuário.
- **SC-003**: Ao reabrir o app sem conexão, a lista de compras mais recente aparece carregada em menos de 1 segundo.
- **SC-004**: 100% dos itens criados ou editados sem conexão permanecem visíveis e corretos após fechar e reabrir o app.
- **SC-005**: Itens pendentes de sincronização são identificáveis pelo usuário através de indicador visual presente na tela de lista.
- **SC-006**: Nenhum dado de item ou lista é perdido em caso de falha de sincronização — o status `error` preserva o registro localmente.
- **SC-007**: O app permanece utilizável (navegação, leitura e escrita de itens) com conexão instável ou ausente, sem travamentos ou mensagens de erro críticas.
- **SC-008**: A regra de bloqueio para listas arquivadas é respeitada offline — nenhum item pode ser adicionado, editado ou removido mesmo sem conexão.
- **SC-009**: Todas as funcionalidades implementadas na Fase 1 continuam funcionando corretamente após a introdução do banco local.

## Assumptions

- O app é usado principalmente em dispositivos com armazenamento local disponível (iOS e Android); armazenamento esgotado é tratado como caso de erro, não como fluxo primário.
- A sincronização bidirecional completa e resolução de conflitos entre múltiplos dispositivos do mesmo usuário é responsabilidade da Fase 3, não desta fase.
- O servidor remoto (Supabase) continua sendo a fonte de verdade para dados sincronizados; o banco local é espelho otimista para performance.
- Dados de `price_history` e `user_events` continuam sendo escritos via servidor remoto nesta fase — apenas listas e itens recebem armazenamento local imediato.
- A sincronização em segundo plano desta fase é simples (tentativa única por operação ou por retomada de conexão), sem filas persistentes complexas, que são escopo da Fase 3.
- O usuário autenticado é identificado localmente pelo mesmo identificador do Supabase Auth, garantindo isolamento de dados por usuário no banco local.
- Todas as strings visíveis ao usuário (mensagens de pendência, erro de sincronização) devem estar em português brasileiro, seguindo a convenção da Fase 1.
- A Fase 1 foi concluída e as funcionalidades de sessão persistente, edição de item, campo marca, bloqueio em listas arquivadas e versionamento estão funcionando — esta fase não deve regressar nenhuma delas.
