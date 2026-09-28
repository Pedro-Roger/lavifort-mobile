# Address Navigation (Maps & Waze) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement clickable address redirection in LarviFort Mobile CRM allowing users to launch Waze, Google Maps, Apple Maps, or copy address via a native ActionSheet/Selector.

**Architecture:** A centralized `maps.service.ts` encapsulates deep link URL schemas, app availability detection (`Linking.canOpenURL`), and platform-aware ActionSheet invocation. The `Task`, `CreateTaskDTO`, and `UpdateTaskDTO` data models support `endereco?: string | null`, integrated in `TaskCard`, `TaskDetailModal`, and `CreateTaskModal`.

**Tech Stack:** React Native / Expo (`Linking`, `ActionSheetIOS`, `Platform`, `Alert`), TypeScript, Jest & `react-test-renderer`.

---

### Task 1: Extend Data Types and Local Database for Address Field

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/services/sync/local-database.ts`
- Test: `src/services/sync/__tests__/local-database.test.ts`

- [ ] **Step 1: Write test asserting address persistence and search in local database**

Add to `src/services/sync/__tests__/local-database.test.ts`:
```typescript
it('persists and filters tasks by address', async () => {
  const taskWithAddress: Task = {
    id: 'task-addr-1',
    titulo: 'Visita Fazenda Camarão Real',
    projetoId: 'operacoes',
    status: 'EM_ANDAMENTO',
    prioridade: 'ALTA',
    progresso: 10,
    endereco: 'Rodovia CE-040, Km 42, Aquiraz - CE',
  };

  await db.upsertTask(taskWithAddress);
  const result = await db.getTasks({ search: 'Aquiraz' });

  expect(result).toHaveLength(1);
  expect(result[0].endereco).toBe('Rodovia CE-040, Km 42, Aquiraz - CE');
});
```

- [ ] **Step 2: Run test to verify it fails if search on address is not yet supported**

Run: `npm test -- local-database.test.ts`

- [ ] **Step 3: Update `src/types/index.ts` and `src/services/sync/local-database.ts`**

In `src/types/index.ts`, ensure `endereco?: string | null;` is in `Task`, `CreateTaskDTO`, `UpdateTaskDTO`.
In `src/services/sync/local-database.ts`, update `search` filter to include `task.endereco?.toLowerCase().includes(query)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- local-database.test.ts`
Expected: PASS

---

### Task 2: Implement Navigation Maps Service (`maps.service.ts`)

**Files:**
- Create: `src/services/maps.service.ts`
- Create: `src/services/__tests__/maps.service.test.ts`

- [ ] **Step 1: Write unit tests for `mapsService`**

Create `src/services/__tests__/maps.service.test.ts`:
```typescript
import { Linking, ActionSheetIOS, Platform, Alert } from 'react-native';
import { mapsService } from '../maps.service';

describe('mapsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds correct deep link and web URLs for Waze, Google Maps, Apple Maps', () => {
    const address = 'Avenida Beira Mar, 1000, Fortaleza';
    const urls = mapsService.getNavigationUrls(address);

    expect(urls.wazeApp).toContain('waze://?q=');
    expect(urls.wazeWeb).toContain('https://waze.com/ul?q=');
    expect(urls.googleMapsWeb).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(urls.appleMapsApp).toContain('maps://?q=');
  });

  it('opens Waze app if supported or falls back to web URL', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);

    await mapsService.openApp('waze', 'Fazenda Sol');

    expect(openURLSpy).toHaveBeenCalledWith(expect.stringContaining('waze://'));
  });

  it('falls back to web URL if native app cannot be opened', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);

    await mapsService.openApp('waze', 'Fazenda Sol');

    expect(openURLSpy).toHaveBeenCalledWith(expect.stringContaining('https://waze.com/ul'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- maps.service.test.ts`
Expected: FAIL ("Cannot find module '../maps.service'")

- [ ] **Step 3: Implement `src/services/maps.service.ts`**

Write `src/services/maps.service.ts` with methods:
- `getNavigationUrls(address: string)`
- `openApp(appId: 'waze' | 'google_maps' | 'apple_maps', address: string)`
- `openAddressSelector(address: string, onCopySuccess?: () => void)`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- maps.service.test.ts`
Expected: PASS

---

### Task 3: Implement `AddressButton` UI Component

**Files:**
- Create: `src/components/ui/AddressButton.tsx`
- Create: `src/components/ui/__tests__/AddressButton.test.tsx`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Write unit tests for `AddressButton`**

Create `src/components/ui/__tests__/AddressButton.test.tsx`:
```typescript
import React from 'react';
import renderer from 'react-test-renderer';
import { AddressButton } from '../AddressButton';
import { mapsService } from '../../../services/maps.service';

describe('AddressButton Component', () => {
  it('renders address and triggers navigation selector on press', () => {
    const openSelectorSpy = jest.spyOn(mapsService, 'openAddressSelector').mockImplementation(jest.fn());

    let tree: renderer.ReactTestRenderer | undefined;
    renderer.act(() => {
      tree = renderer.create(
        <AddressButton address="Rodovia CE-040, Km 42" testID="btn-address" />
      );
    });

    const root = tree!.root;
    const button = root.findByProps({ testID: 'btn-address' });

    renderer.act(() => {
      button.props.onPress();
    });

    expect(openSelectorSpy).toHaveBeenCalledWith('Rodovia CE-040, Km 42');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- AddressButton.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/ui/AddressButton.tsx`**

Implement `AddressButton` rendering a pin icon, address text with truncation, and a "Rotas" badge/button with touch target ≥ 44 dp. Export in `src/components/ui/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- AddressButton.test.tsx`
Expected: PASS

---

### Task 4: Integrate Address in `TaskCard`, `TaskDetailModal`, and `CreateTaskModal`

**Files:**
- Modify: `src/components/tasks/TaskCard.tsx`
- Modify: `src/components/tasks/TaskDetailModal.tsx`
- Modify: `src/components/tasks/CreateTaskModal.tsx`
- Modify: `src/stores/tasks.store.ts`
- Test: `src/components/tasks/__tests__/TaskCard.test.tsx`
- Test: `src/components/tasks/__tests__/TaskDetailModal.test.tsx`
- Test: `src/components/tasks/__tests__/CreateTaskModal.test.tsx`

- [ ] **Step 1: Update test suites for address rendering**

Update test assertions in `TaskCard.test.tsx`, `TaskDetailModal.test.tsx`, and `CreateTaskModal.test.tsx`.

- [ ] **Step 2: Update `TaskCard.tsx`, `TaskDetailModal.tsx`, `CreateTaskModal.tsx`, and `tasks.store.ts`**

- In `TaskCard.tsx`: render `AddressButton` (compact mode) when `task.endereco` is present.
- In `TaskDetailModal.tsx`: render address section with `AddressButton` and include editable address input in edit mode.
- In `CreateTaskModal.tsx`: add text input for `endereco` ("Endereço / Local da Visita").
- In `tasks.store.ts`: ensure `createTask` and `updateTask` pass `endereco` into DTOs and outbox payloads.

- [ ] **Step 3: Run task component tests**

Run: `npm test -- TaskCard.test.tsx TaskDetailModal.test.tsx CreateTaskModal.test.tsx`
Expected: PASS

---

### Task 5: Full Verification & Agent Progress Tracking

**Files:**
- Modify: `.agent/tasks.json`
- Modify: `.agent/progress.md`
- Modify: `.agent/decisions.md`
- Execute: `./scripts/verify.sh`

- [ ] **Step 1: Add `MOB-014` in `.agent/tasks.json` and mark completed upon verification**
- [ ] **Step 2: Record DEC-007 in `.agent/decisions.md`**
- [ ] **Step 3: Execute `./scripts/verify.sh` and ensure 100% PASS**
