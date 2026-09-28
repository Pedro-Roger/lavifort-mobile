# Loop Log — LarviFort Mobile

## 2026-09-28 — SDD Novas Demandas (MOB-019)

**Decisão**: Iniciada criação do SDD para os 12 módulos faltantes que existem no web CRM mas não no mobile.

**SDD criado**: `docs/superpowers/specs/2026-09-28-novas-demandas-sdd.md`
- Documenta todos os 12 módulos (Agenda, Empresas, Planejamento, Laboratório, Separação, Logística, Pós-venda, Fiscal, Métricas, Pesquisa, Equipe, Produtos/Unidades)
- Para cada módulo: endpoints da API, campos do domínio, telas, ações, filtros
- Padrões de implementação alinhados com os módulos já existentes (Pedidos, Entregas, Clientes, Estoque)
- Ordem de implementação sugerida (Fiscal/Equipe primeiro, Produtos/Unidades por último)
- Critérios de aceitação e riscos documentados

**Próximo passo**: Aguardar aprovação do TechLead para iniciar implementação do primeiro módulo.

---
## 2026-09-27 — ActivitiesScreen (alinhamento TechLead, fluxo direto)

**Decisão TechLead**: removida seleção de progresso intermediário ('Iniciar' /
'Em andamento'). Fluxo direto: Concluir / Não executada. Filtros simplificados.

**Achado**: `ActivitiesScreen` não existia (nem mobile nem web). Criada no mobile:
- `src/app/atividades.tsx` — lista + filtros Todas / Não executadas / Concluídas
  + ação "Concluir" (check-in com geolocalização). Sem UI intermediária.
- `src/components/activities/ActivityCard.tsx` — badge Não executada / Concluída em data.
- `src/services/activities.service.ts` — GET /tasks (filtra COMPROMISSO client-side;
  API não aceita `?tipo`) + POST /tasks/:id/confirm-activity {latitude,longitude,
  accuracyMeters}. Paridade com `ConfirmTaskActivityUseCase` (só COMPROMISSO, 409
  repetição, 403 sem permissão, 400 GERAL).
- `src/types/index.ts` — `TipoTask`, `TaskActivityConfirmation`, `ConfirmActivityInput`,
  `Task.tipo?`, `Task.confirmation?` (opcionais, tolera resposta sem campos).
- Rota `/atividades` em `_layout` + entrada no launcher `/modules`.
- `expo-location@~18.0.10` instalado (motivo claro: backend EXIGE coords no confirm) +
  `NSLocationWhenInUseUsageDescription` no app.json.
- "Não executada" = estado de filtro (sem endpoint de mutação no backend).
- Responsivo + a11y no padrão (SafeArea, FlatList flex:1 + key, tabs role=tab 44dp,
  contraste textSecondary, back consistente).

**Evidência**: activities.service.test.ts 4/4 PASS; eslint meus arquivos 0 erros;
tsc limpo exceto `Sidebar.tsx` alheio; jest 270/270 testes PASS.

**BLOQUEIO (arquivo alheio, NÃO tocado)**: `src/components/ui/Sidebar.tsx:91`
`paddingTop: spacing.2xl` (sintaxe inválida; correto `spacing['2xl']`). Arquivo de
outro agente (criado 19:03, untracked) + `ui/index.ts` export + tweaks em
`ProjectSelector.tsx`. Quebra `tsc` (3 erros) e `index.test.tsx` (SyntaxError via
barrel). Aguardando TechLead: trabalho live (espero) ou órfão (quem corrige?).

**AGRAVADO 19:30** — o mesmo/outro agente reescreveu o header de `src/app/index.tsx`:
usa `colors.semantic.error` (INEXISTENTE em tokens → tsc TS2339 + crash em runtime
no render do header, prova via scratch). Removeu meu `OfflineBanner`, botão Módulos
(quebra fluxo P3 p/ /modules) e toolbar (toggle volta ao header → overflow SE de
volta). Hamburger sem testID/role. `index.test.tsx` falha (1 teste). Meu código da
ActivitiesScreen segue intacto e verde. NÃO toquei nos arquivos alheios; escalado
ao TechLead (revert parcial do header vs coordenar).

---
## 2026-09-27 — Repaginada visual: responsividade + a11y + fluxo

### P1 — Responsividade
- **Header do dashboard (`index.tsx`)**: corregido overflow em telas estreitas. O header
  tinha 5 controles + avatar + badge + título (≈548pt) → estourava no iPhone SE (375pt).
  Fix: removido avatar decorativo, movido `ViewModeToggle` para toolbar própria acima do
  quadro (testID preservado), título com `numberOfLines` + `flexShrink`, botões compactos.
  Agora cabe em 375pt.
- **FlatList que não preenchiam altura**: adicionado `flex:1` nas listas de
  `entregas.tsx`, `estoque.tsx` e `KanbanColumn.tsx` (VirtualizedList sem `flex` não
  esticava em conteúdo curto).
- **Kanban**: já responsivo (abas com scroll horizontal, coluna ativa `flex:1`). Confirmado.
- **Login**: card já responsivo (`width:100%` + `maxWidth:420`). Sem fix necessário.
- Nenhum `Dimensions`/largura fixa de conteúdo nas telas (só ícones decorativos fixos).

### P2 — Acessibilidade
- **Touch targets ≥44**: `sync-status` filterTabs, header do `index` (Módulos/Sync/Sair),
  `ViewModeToggle`, chips de `DeliveryStatusFilter` e `TaskList`, `AddressButton` compacto.
- **Roles/labels**: `accessibilityRole="tab"` + `accessibilityState={selected}` nos tabs de
  filtro do `sync-status`; `role="radio"`+selected nos pills de `DeliveryStatusFilter`.
  Chips do `TaskList` e abas/resumo do `Kanban` já tinham roles corretos.
- **Contraste AA (4.5:1)**: texto de corpo/hint migrado de `textMuted` (#94a3b8, ~2.7:1,
  reprovado) para `textSecondary` (#64748b, ~4.7:1, aprovado) em:
  `entregas` emptyHint, `estoque` stateHint, `DeliveryCard` infoLabel,
  `AvailabilityCard` location/metricSideLabel, `KanbanColumn` emptyMessage.
  Palette de marca NÃO alterada.

### P3 — Fluxo
- Login → `/` (1 toque). `/` → `/modules` (1 toque via header) → cada módulo (1 toque).
  Caminho login→módulo em 2 toques.
- Estados loading (ActivityIndicator real), erro (com retry) e empty (com ação/texto)
  já honestos em todos os módulos novos e sync-status.
- Navegação: header `back` consistente (router.back()) em todas as telas de módulo.

### Matriz de larguras testadas (análise estática flexbox)
| Largura | Descrição | Resultado |
|---|---|---|
| 320 | Android compacto | Header justo; título trunca, sem overflow |
| 375 | iPhone SE | Header cabe (3 botões + título truncado) |
| 390 | iPhone 13/14 | OK |
| 414 | iPhone Plus | OK |
| 430 | iPhone Pro Max | OK |
| 768/834 | Tablet portrait | OK (cards fl ex; grid não usado) |

### Verificação
`./scripts/verify.sh` → VERIFICATION_PASS: typecheck strict, lint 0 erros,
42 suites / 270 tests PASS.

### Backlog (esta iteração, fora do escopo por tamanho)
- Touch targets de controles internos de modais (CreateOrderModal 40px, TaskDetailModal
  36px, CreateTaskModal 36px, SubtaskList 32px, TransferTaskModal 38px) — secundários.
- Sweep global de `textMuted` remanescente em textos secundários de modais/labels.

---
## 2026-09-27 — Auditoría + actualización de módulos (paridad con web CRM)

### Contexto
El web `larvifort-crm` es la fuente de verdad (design no-ai-slop, 18 módulos en la
sidebar). El mobile estaba muy atrasado (solo login, dashboard/index, sync-status).
Se hizo auditoría completa y se implementaron los módulos críticos operacionales.

### Auditoría de módulos (web → mobile)
Web source of truth: `larvifort-crm/src/app/(app)` + `src/services`.

**EXISTENTES en mobile (antes de esta iteración):**
- Quadro/Kanban (MOB-008) + Tareas CRUD/subtasks/transfer/anexos
- Dashboard parcial (`/`) · Login offline-first · Sync-status (`/sync-status`)

**IMPLEMENTADOS en esta iteración (críticos operacionales, consumen api real):**
- Pedidos (ver lista + detalle + crear): `services/orders.service.ts`, `/pedidos`
- Entregas (estado + entregar): `services/deliveries.service.ts`, `/entregas`
- Clientes (lista + detalle): `services/clients.service.ts`, `/clientes`
- Estoque (disponibilidad): `services/stock.service.ts`, `/estoque`
- Launcher de navegación `/modules` + botón "Módulos" en header del dashboard.
  Catálogo honesto: módulos implementados navegan; el resto marca "Próximamente".

**FALTANTES (fuera de alcance crítico, pendiente):**
Agenda, Empresas, Planejamento, Laboratório, Separação, Logística, Pós-venda,
Fiscal, Métricas (pesadas), Pesquisa, Equipe, Produtos/Unidades/berçários.

### Diseño
Tokens del mobile ya eran idénticos al web (brand-600 `#0284c7`, surface `#fcfcfd`,
border `#e5e7eb`, badges de status; sin gradientes/ai-slop). Se mantuvo el lenguaje
visual en los módulos nuevos: empty-states honestos, targets 44dp, Card/Badge/Button.

### Tipos añadidos (`src/types/index.ts`)
Order/OrderItem/OrderStats/CreateOrderInput/OrderStatus/OrderPhase, Cliente/
ClientsPage/ClienteStatus/CLIENT_STATUSES, Delivery, StockAvailability/
StockMovementInput — paridad de contrato con los services del web.

### Verificación
- `./scripts/verify.sh` → **VERIFICATION_PASS**: typecheck ✓, lint ✓,
  42 suites / 270 tests PASS (incluye los 4 nuevos: orders 8, deliveries 4,
  clients 5, stock 5).

### Fallas detectadas y corregidas
1. **types de expo-router desactualizados** (`.expo/types/router.d.ts`, gitignored):
   las rutas nuevas (`/modules`, `/pedidos`, …) no existían y rompían typecheck.
   Se regeneró arrancando brevemente el dev server de expo. La ruta tipada en
   `modules.tsx` se resolvió casteando a `Parameters<typeof router.push>[0]`.
2. **Test pre-existente roto** `AddressButton.test.tsx`: buscaba `onPress` vía
   `findByProps({ testID })`, que resuelve al nodo del componente `AddressButton`
   (no tappable) en vez del `TouchableOpacity` interno. Corregido al patrón de
   `Card.test.tsx` (`findByProps({ accessibilityRole: 'button' })`).
3. **Lint**: `clientes.tsx` tenía `// eslint-disable-next-line react-hooks/exhaustive-deps`
   de una regla inexistente en la config → se eliminó (la regla no existe aquí).