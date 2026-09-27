# Loop Log — LarviFort Mobile

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