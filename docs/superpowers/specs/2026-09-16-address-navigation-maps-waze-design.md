# Design Specification — Redirecionamento de Endereço para Maps e Waze

- **Data**: 2026-09-16
- **Status**: Aprovado
- **Módulo**: `larvifort-mobile`
- **Autor / Contexto**: Pedro Roger / LarviFort CRM Mobile

---

## 1. Visão Geral e Objetivo

Permitir que técnicos e consultores de campo cliquem em qualquer endereço vinculado a uma tarefa ou visita e sejam redirecionados com 1 toque para o aplicativo de navegação GPS de sua preferência (**Waze**, **Google Maps** ou **Apple Maps**), ou possam copiar o endereço para a área de transferência.

O funcionamento deve ser totalmente compatível com a arquitetura **Offline-First**, permitindo salvar o endereço localmente e abrir os apps nativos de GPS já instalados no aparelho.

---

## 2. Requisitos e Casos de Uso

1. **RF-NAV-01 (Suporte a Múltiplos Apps de GPS)**:
   - Suporte a deep links para **Waze** (`waze://`), **Google Maps** (`comgooglemaps://` no iOS e URL padrão no Android) e **Apple Maps** (`maps://` no iOS).
   - Fallback automático para URLs Web caso o aplicativo nativo não esteja instalado.
   - Opção para copiar o endereço para a área de transferência.

2. **RF-NAV-02 (Menu Seletor de Rotas / ActionSheet)**:
   - Ao clicar no endereço ou botão de rotas, abrir um menu contextual / ActionSheet para o usuário escolher o aplicativo desejado.

3. **RF-NAV-03 (Modelagem de Dados e Persistência)**:
   - Adicionar o campo opcional `endereco?: string | null` às interfaces `Task`, `CreateTaskDTO`, `UpdateTaskDTO`.
   - O endereço é salvo localmente no banco SQLite / AsyncStorage e sincronizado com o backend.

4. **RF-NAV-04 (Integração na Interface do Usuário)**:
   - **`CreateTaskModal`**: Campo de texto para preenchimento de endereço da visita/fazenda.
   - **`TaskCard`**: Exibição compacta do endereço com ícone de localização quando preenchido.
   - **`TaskDetailModal`**: Bloco visual com endereço, botão de rotas e campo editável.

---

## 3. Arquitetura e Estrutura de Arquivos

### 3.1. Novos Arquivos
- `src/services/maps.service.ts`: Serviço utilitário para construção de URLs, checagem de apps instalados e acionamento do menu nativo/ActionSheet de navegação.
- `src/services/__tests__/maps.service.test.ts`: Testes unitários do serviço de navegação com mocks de `Linking` e `ActionSheetIOS`.
- `src/components/ui/AddressButton.tsx` (ou componente inline integrado): Componente reutilizável com ícone de mapa e trigger de navegação.
- `src/components/ui/__tests__/AddressButton.test.tsx`: Testes unitários do componente de endereço.

### 3.2. Arquivos Modificados
- `src/types/index.ts`: Inclusão de `endereco?: string | null` em `Task`, `CreateTaskDTO`, `UpdateTaskDTO`.
- `src/components/tasks/TaskCard.tsx`: Exibição do endereço com clique para abrir o seletor de rotas.
- `src/components/tasks/TaskDetailModal.tsx`: Visualização e edição do endereço com botão de navegação.
- `src/components/tasks/CreateTaskModal.tsx`: Inclusão do campo de endereço na criação rápida de tarefas.
- `src/stores/tasks.store.ts`: Preservação e sincronização do campo `endereco`.
- `src/services/sync/local-database.ts`: Busca e filtro considerando endereço.
- `.agent/tasks.json` & `.agent/progress.md`: Adição e acompanhamento da tarefa `MOB-014`.

---

## 4. Esquemas de URLs e Deep Links

- **Waze**:
  - App Scheme: `waze://?q=${encodeURIComponent(address)}&navigate=yes`
  - Fallback Web: `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`
- **Google Maps**:
  - iOS App Scheme: `comgooglemaps://?q=${encodeURIComponent(address)}`
  - Universal Web / Android: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
- **Apple Maps**:
  - iOS App Scheme: `maps://?q=${encodeURIComponent(address)}`
  - Fallback Web: `https://maps.apple.com/?q=${encodeURIComponent(address)}`

---

## 5. Critérios de Aceitação (DoD)

1. `mapsService` constrói as URLs corretas para Waze, Google Maps e Apple Maps.
2. Ao clicar no endereço no Card ou no Modal de Detalhes, o seletor de aplicativos é disparado.
3. Criação e edição de tarefas persistem o campo `endereco` localmente e na fila outbox.
4. Testes unitários cobrem o serviço de navegação e componentes visuais.
5. `./scripts/verify.sh` passa com 100% de sucesso (TypeScript strict, ESLint e Testes).
