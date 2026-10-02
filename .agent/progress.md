# Agent Progress — LarviFort Mobile CRM

## Current Task

**Módulo Pesquisa de Campo (2026-10-01)** — tela `/pesquisas` + service
`GET/POST /pesquisas` + fila offline (padrão clients/checkin). Atalhos: Sidebar
da home + launcher `/modules`. `./scripts/verify.sh` → **VERIFICATION_PASS**
(48 suites / 329 testes, +8 testes de pesquisas).

## Status

FIELD_RESEARCH_DONE.

## Implementação

- `src/services/pesquisas.service.ts`: GET `/pesquisas` (alias /searches no
  backend; lista paginada, filtros clienteId/responsavelId/startDate/endDate),
  POST `/pesquisas` (CreateFieldSearchDto), normalização tolerante
  (normalizeFieldSearch), fila `pendingSearchesQueue` (OfflineQueue em
  `services/offline-queue.ts`), `savePendingSearch`, `syncPendingSearches`
  (400/422 descarta; rede falha mantém), `getSearchesWithPending`.
- `src/components/pesquisas/`: `FieldSearchCard` (badges de uniformidade,
  chips de larvas, badge "Pendente de envio") e `FieldSearchFormModal`
  (questionário completo: cliente com busca, data, pós-larvas chips+outra,
  maioria Larvifort obrigatório, parou/motivos de saída, uniformidade
  berçário/cultivo, sobrevivência %, resultados/observações).
- `src/app/pesquisas.tsx`: lista remota + pendências locais, auto-sync
  best-effort ao abrir, botão "Sincronizar pendentes", salvamento offline com
  Alert "Salvo no aparelho".
- Rotas: `_layout.tsx` (pesquisas), `modules.tsx` (launcher),
  `Sidebar.tsx` (atalho na home, ícone ClipboardList).
- Tipos: `Uniformidade`, `FieldSearch`, `FieldSearchInput`,
  `PendingFieldSearchRecord`.
- Teste: `pesquisas.service.test.ts` 8/8 (list/normalize/filters/POST/pendency
  queue/sync 400+network/flat clienteNome).

## Validation

- `./scripts/verify.sh` → **VERIFICATION_PASS** (typecheck ✓, ESLint ✓,
  48 suites / 329 testes PASS).

## Next Action

TechLead homologa. Pendências de homologação anteriores permanecem stageadas.

---

## Última iteración — Repaginada visual

- **P1 Responsividade**: header do dashboard com overflow em telas estreitas corrigido
  (toggle movido a toolbar, avatar removido, título truncado, botões compactos → cabe em 375pt).
  FlatList com `flex:1` em entregas/estoque/KanbanColumn. Kanban já responsivo.
- **P2 A11y**: touch targets ≥44 (header, filtros sync-status/TaskList/DeliveryStatusFilter,
  ViewModeToggle, AddressButton), roles/semantics (tabs/radio + selected), contraste AA
  (textMuted→textSecondary em texto de corpo; palette de marca intacta).
- **P3 Fluxo**: login→módulo em 2 toques (via `/modules` no header). Loading/erro/empty
  honestos. Back consistente.
- Matriz de larguras documentada em `.loop/LOG.md` (320→834pt, sin overflow ≥375).
- Backlog (modais internos) registrado em `.loop/LOG.md`.

## Validation

- `./scripts/verify.sh` → **VERIFICATION_PASS** (typecheck + lint + 42/270 tests).

## Next Action

Sweep de a11y/contraste em modais internos (backlog) ou seguir com MOB-019.

## Auditoría de módulos (web → mobile)

**Ya existentes en mobile:** Quadro/Kanban (MOB-008), Tareas (CRUD/subtasks/transfer/anexos),
Dashboard parcial (`/`), Login offline-first, Sync-status.

**Implementados en esta iteración (MOB-014..018):**
- `MOB-014` Pedidos (ver+crear): `services/orders.service.ts`, `/pedidos`
- `MOB-015` Entregas (estado+entregar): `services/deliveries.service.ts`, `/entregas`
- `MOB-016` Clientes (lista+detalle): `services/clients.service.ts`, `/clientes`
- `MOB-017` Estoque (disponibilidad): `services/stock.service.ts`, `/estoque`
- `MOB-018` Launcher `/modules` + botón "Módulos" en header + tipos en `types/index.ts`

**Pendientes (`MOB-019`):** Agenda, Empresas, Planejamento, Laboratório, Separação,
Logística, Pós-venda, Fiscal, Métricas, Pesquisa, Equipe, Produtos/Unidades.

## Diseño

Tokens del mobile ya idénticos al web (brand-600 `#0284c7`, surface `#fcfcfd`,
border `#e5e7eb`, badges de status, sin gradientes/ai-slop). Módulos nuevos siguen
el mismo lenguaje: Card/Badge/Button, empty-states honestos, targets 44dp.

## Validation

- `./scripts/verify.sh` → **VERIFICATION_PASS** (typecheck strict ✓, ESLint ✓,
  42 suites / 270 tests PASS, incl. orders 8, deliveries 4, clients 5, stock 5).
- Rutas tipadas de expo-router regeneradas (`.expo/`, gitignored).

## Next Action

Priorizar `MOB-019` (módulos restantes) o evolucionar los existentes.