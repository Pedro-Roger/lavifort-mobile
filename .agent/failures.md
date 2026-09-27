# Known Failures and Lessons

Record recurring failures, root causes, and resolutions.

## 2026-09-27 — types de expo-router desactualizados al añadir rutas nuevas
- **Síntoma**: `tsc --noEmit` fallaba: `router.push('/modules')` / `router.push(route)`
  no asignable al union tipado (rutas nuevas no existían en `.expo/types/router.d.ts`).
- **Causa raíz**: `.expo/` es generado y gitignored; el archivo tipado se regenera al
  arrancar el dev server de `expo start`. Al añadir pantallas (`/modules`, `/pedidos`,
  `/entregas`, `/clientes`, `/estoque`), el `router.d.ts` quedaba obsoleto.
- **Resolución**: regenerar con `npx expo start` breve (genera `.expo/types/router.d.ts`).
  Para llamadas genéricas a `router.push(route)` con `route: string`, castear a
  `Parameters<typeof router.push>[0]` (ver `src/app/modules.tsx`).
- **Lección**: al tocar `src/app/*.tsx` con expo-router tipado, regenerar los tipos antes
  de `typecheck`.

## 2026-09-27 — test UI pre-existente roto (AddressButton)
- **Síntoma**: `AddressButton.test.tsx`: `button.props.onPress is not a function`.
- **Causa raíz**: `findByProps({ testID })` resuelve al nodo del componente `AddressButton`
  (no-tappable, recibe `testID` como prop propia) en vez del `TouchableOpacity` interno
  (donde vive `onPress`).
- **Resolución**: buscar por `findByProps({ accessibilityRole: 'button' })`, igual que
  `Card.test.tsx`.
- **Lección**: en react-test-renderer, para componentes RN tappables buscar por
  `accessibilityRole='button'`, no por `testID` del componente.

## 2026-09-27 — lint: regla inexistente react-hooks/exhaustive-deps
- **Síntoma**: error "Definition for rule 'react-hooks/exhaustive-deps' was not found".
- **Causa raíz**: se usó `// eslint-disable-next-line react-hooks/exhaustive-deps` pero la
  config (`.eslintrc.js`) no carga el plugin `react-hooks`.
- **Resolución**: eliminar el comentario de disable (la regla no está activa).
