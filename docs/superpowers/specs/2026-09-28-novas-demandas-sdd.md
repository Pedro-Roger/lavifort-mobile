# SDD — Novas Demandas (Módulos Faltantes)

- **Data**: 2026-09-28
- **Status**: Rascunho (aguardando aprovação do TechLead)
- **Módulo**: `larvifort-mobile` — MOB-019
- **Autor / Contexto**: Pedro Roger / LarviFort CRM Mobile

---

## 1. Visão Geral e Objetivo

O **LarviFort Mobile** está operacional com 8 módulos (Dashboard, Kanban, Pedidos, Entregas, Clientes, Estoque, Atividades, Sync Status). No entanto, o web CRM (`larvifort-crm`) possui **12 módulos adicionais** que ainda não foram implementados no mobile. Este SDD documenta o design e a implementação desses módulos faltantes para garantir paridade funcional entre web e mobile.

**Objetivo**: Implementar os 12 módulos no mobile, seguindo os mesmos padrões de design system, offline-first, acessibilidade e responsividade já estabelecidos.

---

## 2. Módulos a Implementar

| # | Módulo | API Endpoint | Web CRM | Prioridade | Complexidade |
|---|--------|-------------|---------|------------|-------------|
| 1 | **Agenda** | `/appointments` | `app/(app)/agenda/page.tsx` | 🔴 Alta | Média |
| 2 | **Empresas** | `/companies`, `/commercial-groups` | `app/(app)/empresas/page.tsx` | 🔴 Alta | Alta |
| 3 | **Planejamento** | `/planning/analytics` | `app/(app)/planejamento/page.tsx` | 🔴 Alta | Alta |
| 4 | **Laboratório** | `/lab/orders`, `/lab/work-orders` | `app/(app)/laboratorio/page.tsx` | 🔴 Alta | Média |
| 5 | **Separação** | `/separation/orders` | `app/(app)/separacao/page.tsx` | 🔴 Alta | Média |
| 6 | **Logística** | `/logistics/drivers`, `/logistics/vehicles` | `app/(app)/logistica/page.tsx` | 🔴 Alta | Alta |
| 7 | **Pós-venda** | `/post-sales` | `app/(app)/pos-venda/page.tsx` | 🔴 Alta | Média |
| 8 | **Fiscal** | `/orders/:id/fiscal` | `app/(app)/fiscal/page.tsx` | 🔴 Alta | Baixa |
| 9 | **Métricas** | `/metrics/*` | `app/(app)/metricas/page.tsx` | 🔴 Alta | Alta |
| 10 | **Pesquisa** | `/pesquisas`, `/searches` | `app/(app)/pesquisa/page.tsx` | 🔴 Alta | Média |
| 11 | **Equipe** | `/teams` | `app/(app)/equipe/page.tsx` | 🔴 Alta | Baixa |
| 12 | **Produtos/Unidades** | `/products`, `/stock/units` | `app/(app)/produtos/page.tsx` | 🔴 Alta | Alta |

**Todas as 12 prioridades são Alta** — existem no web CRM com implementação completa e endpoints backend funcionais.

---

## 3. Padrões de Implementação

Cada módulo segue o mesmo padrão dos módulos já implementados (Pedidos, Entregas, Clientes, Estoque):

### 3.1. Estrutura de Arquivos por Módulo

```
src/services/{module}.service.ts          # Serviço de API
src/services/__tests__/{module}.service.test.ts  # Testes unitários
src/components/{module}/                # Componentes específicos
src/components/{module}/index.ts         # Barrel export
src/app/{route}.tsx                      # Tela principal (Expo Router)
```

### 3.2. Padrões de Serviço

- Todos os serviços usam `apiClient` do `src/services/api.ts`
- `normalizeApiResponse()` para envelopes `{ data }`
- Tratamento de erros consistente (try/catch nos componentes, não nos serviços)
- Tipos alinhados com `src/types/index.ts`

### 3.3. Padrões de Tela

- `SafeAreaView` com `edges={['top', 'left', 'right']}`
- Header com botão "Atrás" (44dp touch target) + título
- FlatList com `flex: 1` para preencher altura disponível
- Estados honestos: loading (ActivityIndicator), empty ("Sem X"), error (retry button)
- Filtros com tabs role="tab", minTouchTarget 44dp, contraste AA
- Navegação consistente: `router.back()` para voltar

### 3.4. Padrões de Acessibilidade

- Touch targets ≥ 44dp em todos os controles interativos
- Contraste AA (4.5:1) para texto corporal (usar `textSecondary` #64748b)
- `accessibilityRole` e `accessibilityState` em tabs/radio groups
- `accessibilityLabel` descritivo em todos os botões
- `numberOfLines` em textos longos para evitar overflow

---

## 4. Detalhamento por Módulo

### 4.1. Agenda (`/agenda`)

**Backend**: `/appointments` — CRUD completo de compromissos

**Campos do Appointment**:
- `id`, `tipo` (REUNIAO | VISITA), `titulo`, `data`, `horario`
- `endereco`, `observacoes`, `clienteId`, `empresaId`, `ownerId`

**Tela principal**: Lista de compromissos do dia/semana com filtro por tipo
**Ações**: Criar compromisso (FAB), editar, excluir, visualizar detalhes
**Filtros**: Hoje / Semana / Mês; tipo (Reunião / Visita)

### 4.2. Empresas (`/empresas`)

**Backend**: `/companies`, `/commercial-groups`

**Campos da Company**: `id`, `name`, `cnpj`, `city`, `status` (ATIVA | PROSPECT | INATIVA), `grupoId`
**Campos do CommercialGroup**: `id`, `name`, `color`, `createdAt`, `updatedAt`

**Tela principal**: Lista de empresas com busca e filtro por status/grupo
**Tela de detalhe**: Informações da empresa, clientes vinculados
**Tela de grupos**: Lista de grupos comerciais

### 4.3. Planejamento (`/planejamento`)

**Backend**: `/planning/analytics` (GET/POST)

**Dados**: Resumo de estoque, vendas, produção por período
**Tela**: Dashboard com cards de métricas e gráficos resumidos
**Filtros**: Período (7/30/90 dias), tipo (SUMMARY | STOCK | SALES | PRODUCTION)

### 4.4. Laboratório (`/laboratorio`)

**Backend**: `/lab/orders`, `/lab/work-orders`

**Campos**: `LabWorkOrder` (id, orderId, orderNumber, clientName, productId, productName, quantity, unit, stockUnitId, stockLocationId, deliveryDate, status)
**Status**: AGUARDANDO_LABORATORIO | RECEBIDO | EM_PREPARACAO | PRONTO_PARA_SEPARACAO | BLOQUEADO | CANCELADO

**Tela**: Lista de ordens de trabalho laboral com filtro por status
**Ações**: Gerar ordem de serviço a partir de pedido fechado, atualizar status

### 4.5. Separação (`/separacao`)

**Backend**: `/separation/orders`, `/orders/:id/separation/start`, `/orders/:id/separation/complete`, `/orders/:id/separation/divergence`

**Campos**: `SeparationStatus` (AGUARDANDO_SEPARACAO | EM_SEPARACAO | SEPARADO | DIVERGENCIA)

**Tela**: Lista de pedidos em separação com filtro por status
**Ações**: Iniciar separação, marcar como concluída, reportar divergência

### 4.6. Logística (`/logistica`)

**Backend**: `/logistics/drivers`, `/logistics/vehicles`

**Campos do Driver**: `id`, `name`, `phone`, `document`, `status`, `region`
**Campos do Vehicle**: `id`, `plate`, `status`

**Tela**: Lista de motoristas e veículos (abas ou lista separada)
**Ações**: CRUD completo para motoristas e veículos

### 4.7. Pós-venda (`/pos-venda`)

**Backend**: `/post-sales`, `/post-sales/deliveries/:deliveryId`, `/post-sales/:id`, `/post-sales/:id/complete`

**Campos**: `PostSaleStatus` (AGUARDANDO_CONTATO | CONTATO_FEITO | LARVA_OK | CLIENTE_COM_PROBLEMA | REVISITA_NECESSARIA | FINALIZADO)

**Tela**: Lista de pós-vendas com filtro por status
**Ações**: Iniciar pós-venda (a partir de entrega), atualizar status, marcar como concluído

### 4.8. Fiscal (`/fiscal`)

**Backend**: `/orders/:id/fiscal` (GET/GET), `/orders/:id/fiscal` (PATCH)

**Campos**: `FiscalStatus` (NAO_SOLICITADO | PENDENTE_DADOS | PRONTO_EMISSAO | NF_EMITIDA | NF_CANCELADA)

**Tela**: Detalhes fiscais de um pedido (acessível a partir da tela de pedidos)
**Ações**: Atualizar dados fiscais, alterar status NF-e

### 4.9. Métricas (`/metricas`)

**Backend**: `/metrics/options`, `/metrics/goals`, `/metrics/analysis`, `/metrics/operations/*`

**Dados**: Opções de métricas, metas, análises por período, funil operacional
**Tela**: Dashboard com opções de métricas, metas por período, análise de dados

### 4.10. Pesquisa (`/pesquisa`)

**Backend**: `/pesquisas`, `/searches`

**Campos**: `FieldSearch` (id, clienteId, cliente, dataPesquisa, responsavelId, responsavel, larvas, uniformidadeBercario, uniformidadeCultivo, etc.)

**Tela**: Lista de pesquisas de campo com filtro por data/responsável/cliente
**Ações**: Criar pesquisa, editar, excluir, visualizar detalhes

### 4.11. Equipe (`/equipe`)

**Backend**: `/teams`

**Campos**: `Team` (id, name, createdAt, updatedAt)

**Tela**: Lista de equipes com CRUD completo
**Ações**: Criar equipe, editar, excluir, gerenciar membros

### 4.12. Produtos/Unidades (`/produtos`)

**Backend**: `/products`, `/stock/units`, `/stock/locations`, `/stock/movements`

**Campos do Product**: `id`, `code`, `name`, `unit`, `price`, `isActive`
**Campos do StockUnit**: `id`, `name`, `city`, `status` (ACTIVA | INACTIVA)
**Campos do StockLocation**: `id`, `name`, `unitId`, `type` (BERCARIO | ALMACEN | OTRO)

**Tela**: Lista de produtos com busca, filtro por ativo/inativo
**Sub-telas**: Unidades de estoque, locais de armazenamento
**Ações**: CRUD completo para produtos, unidades e locais

---

## 5. Roteamento e Layout

Todos os novos módulos precisam ser registrados em:

1. **`src/app/_layout.tsx`** — adicionar `Stack.Screen` para cada módulo
2. **`src/app/modules.tsx`** — adicionar entrada no launcher (substituir `route: null` por rota real)
3. **`src/components/ui/Sidebar.tsx`** — adicionar link no menu lateral

---

## 6. Dependências

- Nenhuma dependência nova necessária para a maioria dos módulos
- `expo-location` já instalado (para Atividades)
- Todos os endpoints usam autenticação JWT existente

---

## 7. Critérios de Aceitação

Para cada módulo:
- [ ] Service com todos os endpoints CRUD implementados
- [ ] Testes unitários (mínimo 3 testes por service)
- [ ] Tela principal com lista, filtros e ações
- [ ] Tela de detalhe quando aplicável
- [ ] Acessibilidade: touch targets ≥44dp, contraste AA, roles/semantics
- [ ] Responsivo: funciona em iPhone SE (375pt) a Pro Max (430pt) e tablets
- [ ] Estados honestos: loading, empty, error
- [ ] Navegação consistente com back button
- [ ] `verify.sh` passa (tsc + lint + tests)
- [ ] Documentado em `.loop/LOG.md`

---

## 8. Ordem de Implementação Sugerida

1. **Fiscal** e **Equipe** — menor complexidade, CRUD simples
2. **Agenda** — CRUD completo, muito usado em campo
3. **Separação** e **Laboratório** — fluxos operacionais diretos
4. **Pós-venda** e **Pesquisa** — CRUD com status tracking
5. **Empresas** e **Logística** — CRUD com relacionamentos
6. **Planejamento** e **Métricas** — dashboards com analytics
7. **Produtos/Unidades** — CRUD mais complexo com sub-telas

---

## 9. Riscos e Bloqueios

- **Risco**: Alguns endpoints podem ter permissões específicas (ex: Fiscal requer role específico) — validar com backend antes de implementar
- **Risco**: Módulos como Métricas e Planejamento podem ter cálculos complexos no backend que precisam de tempo de processamento — considerar loading states
- **Bloqueio**: `Sidebar.tsx` tem erro de sintaxe (`spacing.2xl` inválido) — precisa ser corrigido antes de adicionar novos links ao menu lateral

---

## 10. Próximos Passos

1. Aprovar este SDD com o TechLead
2. Definir qual módulo implementar primeiro
3. Criar task ticket no `.loop/TASKS.json`
4. Iniciar implementação seguindo os padrões documentados
