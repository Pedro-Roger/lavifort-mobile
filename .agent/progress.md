# Agent Progress — LarviFort Mobile CRM

## Current Task

`MOB-020` (Task 1.2) — Carteira por região da vendedora + Check-in GPS + CRM
offline/simplificado. **Rodada corretiva pós-QA aplicada e VERDE.**
`./scripts/verify.sh` → **VERIFICATION_PASS** (47 suites / 315 testes).

## Status

TASK_1_2_CORRECTIVE_DONE.

## Rodada corretiva (QA) — contrato real + limpeza

- **Geofence real**: `Region` mobile agora `centerLat/centerLng/radiusKm: number | null`
  (paridade com o backend). `verifyRegion` em `services/checkin.service.ts` valida por
  raio em km quando há coordenadas; `null` → fallback (uf/cidade na carteira).
- **Status do cliente**: `Cliente` ganhou `status?: 'ativo'|'inativo'` e `regiaoId?`.
  `regions.service.ts`: `isActiveClient` + `filterCarteira` (só ativos da região);
  `clientBelongsToRegion` prioriza `regiaoId`. `/carteira` e `/checkin` usam `filterCarteira`.
- **Arquivos soltos (outro agente) ELIMINADOS**: `src/app/cadastro-cliente.tsx` +
  `src/hooks/useCadastroCliente.ts` (protótipo: regiões hardcoded, GPS mockado, campos
  fora do contrato, sem rota). Não existe `cadastro-cliente.service.ts`.

## Validation

- `./scripts/verify.sh` → **VERIFICATION_PASS** (typecheck ✓, ESLint ✓,
  47 suites / 315 testes PASS, incl. regions 16 + checkin 9 novos).

## Next Action

TechLead homologa a rodada corretiva. Backlog `MOB-019` segue pendente.

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