# Architecture Specification — LarviFort Mobile CRM

## 1. Visão Geral da Arquitetura

O **LarviFort Mobile** é construído como uma aplicação móvel **Offline-First**, estruturada sobre **Expo (React Native)** e **TypeScript**, focada em máxima confiabilidade em campo, reatividade instantânea na UI e sincronização bidirecional resiliente com a **`lavifort-API`**.

```
+---------------------------------------------------------------+
|                       UI Layer (Screens & Components)         |
|   Expo Router (Tabs/Stack) | Kanban Board | Task Form | Detail|
+---------------------------------------------------------------+
                                |
                                v
+---------------------------------------------------------------+
|                 State & Business Logic Layer                  |
|    Zustand Stores (Tasks, Projects, Auth) + React Hooks       |
+---------------------------------------------------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-------------------+
|  Local Storage / DB   |                   |   Outbox Queue    |
| (SQLite / AsyncStorage|                   | (Pending offline  |
|   + MMKV Cache)       |                   |    mutations)     |
+-----------------------+                   +-------------------+
                                                        |
                                                        v
                                            +-------------------+
                                            |    Sync Engine    |
                                            | (NetInfo Trigger) |
                                            +-------------------+
                                                        |
                                                        v
                                            +-------------------+
                                            |  API Client HTTP  |
                                            |  (Axios / Fetch)  |
                                            +-------------------+
                                                        |
                                                        v (Online)
                                            +-------------------+
                                            |   lavifort-API    |
                                            |   (NestJS / PG)   |
                                            +-------------------+
```

---

## 2. Stack Tecnológica

| Componente | Tecnologia | Justificativa |
|---|---|---|
| **Framework Base** | **Expo (React Native 0.76+)** | Suporte multi-plataforma iOS/Android, OTA updates e ecossistema maduro para sensores de câmera/arquivos. |
| **Linguagem** | **TypeScript 5.x** | Tipagem estrita compartilhada com os contratos do backend e do web frontend. |
| **Roteamento** | **Expo Router (File-based)** | Navegação declarativa, deep links e suporte natural a Tabs e Stacks nativos. |
| **Estilização / UI** | **NativeWind (Tailwind CSS) + Styled Tokens** | Espelha as classes utilitárias e o design system do `larvifort-crm`. |
| **Ícones** | **Phosphor Icons (`@phosphor-icons/react-native` ou Lucide)** | Mesma biblioteca de ícones do frontend web (`@phosphor-icons/react`). |
| **Gerenciamento de Estado** | **Zustand + Immer** | Gerenciamento de estado leve, síncrono e de fácil persistência para a UI e a fila de mutações. |
| **Armazenamento Local** | **`expo-sqlite` / `@react-native-async-storage/async-storage`** | Banco de dados local para cache offline estruturado de tarefas, projetos e outbox. |
| **Storage Seguro** | **`expo-secure-store`** | Armazenamento criptografado de tokens JWT de autenticação. |
| **Detecção de Conexão** | **`@react-native-community/netinfo`** | Gatilho automático para início e pausa da sincronização. |
| **Cliente HTTP** | **Axios com Interceptors** | Interceptors para injeção automática de Bearer Token e captura de erros de rede. |

---

## 3. Estrutura de Diretórios e Fronteiras de Módulos

```
larvifort-mobile/
├── assets/                  # Imagens, fontes e splash screen
├── src/
│   ├── app/                 # Rotas do Expo Router
│   │   ├── _layout.tsx      # Root Layout (Providers de Auth, Theme, Sync)
│   │   ├── (auth)/          # Grupo de autenticação (Login, Recuperação)
│   │   │   └── login.tsx
│   │   └── (tabs)/          # Navegação principal por abas
│   │       ├── _layout.tsx  # Tab bar customizada
│   │       ├── index.tsx    # Redirecionamento / Dashboard operacional
│   │       ├── kanban/      # Tela e sub-rotas do Quadro Kanban de Tarefas
│   │       │   ├── index.tsx
│   │       │   └── [id].tsx # Detalhes da tarefa
│   │       └── sync/        # Painel de status da sincronização offline
│   │           └── index.tsx
│   ├── components/          # Componentes reutilizáveis de UI
│   │   ├── ui/              # Átomos (Button, Input, Badge, Card, Avatar, Slider, Toast)
│   │   ├── kanban/          # Componentes do Kanban (Column, TaskCard, TaskQuickCreate, FilterBar)
│   │   └── common/          # Header, OfflineBanner, SyncIndicator
│   ├── core/                # Fundamentos do sistema
│   │   ├── config/          # Variáveis de ambiente (API_URL, Timeout)
│   │   ├── theme/           # Tokens de cor, espaçamento, tipografia e bordas
│   │   └── storage/         # Abstrações de SecureStore e SQLite/AsyncStorage
│   ├── services/            # Comunicação externa e Sync Engine
│   │   ├── api.ts           # Cliente HTTP configurado com base URL e interceptors
│   │   ├── auth.service.ts  # Autenticação e tokens
│   │   ├── tasks.service.ts # Consumo dos endpoints de tarefas (/tasks)
│   │   ├── sync/            # Motor de Sincronização Offline-First
│   │   │   ├── sync-engine.ts      # Orquestrador de sincronização
│   │   │   ├── outbox-queue.ts     # Fila de mutações locais pendentes
│   │   │   ├── local-database.ts   # Repositório local de tarefas e projetos
│   │   │   └── network-monitor.ts  # Listener do NetInfo
│   ├── stores/              # Stores Zustand (AuthStore, TasksStore, SyncStore)
│   ├── types/               # Definições de tipos (Task, Projeto, Status, Prioridade)
│   └── utils/               # Formatadores de data, labels e helpers
├── scripts/
│   ├── verify.sh            # Script de validação (lint + typecheck + tests)
│   └── agent-loop.sh        # Loop de desenvolvimento autônomo
├── SPEC.md
├── ARCHITECTURE.md
├── AGENTS.md
└── package.json
```

---

## 4. Padrão e Motor Offline-First (Sync Engine)

### 4.1. O Ciclo de Leitura e Escrita
1. **Leitura (Read-Path)**:
   - A UI sempre consome os dados do banco de dados local (`Local Database`).
   - Não há loaders de tela cheia bloqueantes aguardando a rede durante a navegação comum.
   - Quando online, um fetch em background sincroniza o banco local com o backend (`lavifort-API`).

2. **Escrita (Write-Path com Optimistic UI)**:
   - O usuário cria uma tarefa, altera o status ou edita campos.
   - A alteração é aplicada imediatamente no `Local Database` e refletida na UI (< 16ms).
   - Um evento de mutação é serializado e inserido na tabela `OutboxQueue` local com status `PENDING` e timestamp ISO.
   - O `Sync Engine` é notificado.

3. **Drenagem da Fila (Sync Outbox Worker)**:
   - Se o dispositivo estiver online (`NetInfo.isConnected === true`):
     - As mutações da `OutboxQueue` são lidas em ordem cronológica (FIFO).
     - Para cada mutação:
       - Executa a requisição HTTP correspondente (ex: `POST /tasks`, `PATCH /tasks/:id/status`).
       - Ao receber status `200/201/204`: remove o item da outbox e marca o registro local como `SYNCED`.
       - Se houver falha de rede temporária: mantém na fila com contador de retentativas e backoff exponencial.
       - Se houver erro de validação (400/422): registra o conflito na outbox com status `ERROR` para inspeção do usuário.

```typescript
// Estrutura de um item na Outbox
export interface OutboxMutation {
  id: string;              // UUID da mutação
  entityId: string;        // ID da tarefa ou projeto
  entityType: 'TASK' | 'PROJECT' | 'ATTACHMENT';
  action: 'CREATE' | 'UPDATE' | 'UPDATE_STATUS' | 'DELETE' | 'TRANSFER';
  payload: Record<string, any>;
  createdAt: string;       // Timestamp ISO
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'ERROR';
  errorMessage?: string;
}
```

---

## 5. Integração com os Endpoints da `lavifort-API`

O mobile consome exatamente os mesmos endpoints que o `larvifort-crm` consome no backend NestJS:

| Funcionalidade | Método | Endpoint API | Descrição |
|---|---|---|---|
| **Login** | `POST` | `/auth/login` | Retorna JWT Token e dados do usuário |
| **Listar Tarefas** | `GET` | `/tasks?projetoId={id}` | Busca lista paginada de tarefas |
| **Obter Tarefa** | `GET` | `/tasks/:id` | Detalhes com anexos e subtarefas |
| **Criar Tarefa** | `POST` | `/tasks` | Criação com payload `{ projetoId, titulo, ... }` |
| **Atualizar Tarefa**| `PATCH`| `/tasks/:id` | Atualização parcial de campos |
| **Alterar Status** | `PATCH`| `/tasks/:id/status` | Atualiza status (`BACKLOG`, `EM_ANDAMENTO`, `EM_REVISAO`, `CONCLUIDO`) |
| **Progresso** | `PATCH`| `/tasks/:id/progresso` | Atualiza percentual de 0 a 100 |
| **Excluir Tarefa** | `DELETE`| `/tasks/:id` | Remoção de tarefa |
| **Listar Projetos**| `GET` | `/tasks/projects` | Lista setores/projetos (Comercial, Operações, etc.) |
| **Transferir** | `POST` | `/tasks/:id/transfer` | Move entre quadros ou converte em subtarefa |

---

## 6. Design System & Identidade Visual

O mobile adota rigorosamente os tokens de design do `larvifort-crm`:

- **Cores Principais (Brand)**:
  - `brand-500`: `#0ea5e9`
  - `brand-600`: `#0284c7` (Cor primária dos botões, tabs e destaques)
  - `brand-700`: `#0369a1`
- **Cores de Superfície e Fundo**:
  - Background geral: `#fcfcfd`
  - Cards e Modais: `#ffffff`
  - Bordas: `#e5e7eb`
  - Texto Primário: `#0f172a`
  - Texto Secundário: `#64748b`
- **Cores Semânticas de Status**:
  - `BACKLOG`: Badge Slate (Fundo `#f1f5f9`, Texto `#475569`)
  - `EM_ANDAMENTO`: Badge Sky/Blue (Fundo `#e0f2fe`, Texto `#0369a1`)
  - `EM_REVISAO`: Badge Amber (Fundo `#fef3c7`, Texto `#b45309`)
  - `CONCLUIDO`: Badge Emerald (Fundo `#d1fae5`, Texto `#047857`)

---

## 7. Diretrizes de Segurança e Resiliência em Campo

1. **Proteção de Credenciais**: Tokens JWT e chaves de sessão nunca são gravados em texto plano no disco; utilizam `Expo SecureStore`.
2. **Prevenção de Perda de Dados**: Mutações locais são gravadas no banco SQLite de forma síncrona/atômica antes de fechar qualquer tela.
3. **Consumo de Bateria e Dados Móveis**: O `Sync Engine` suspende requisições ativas se o dispositivo reportar bateria crítica ou se o modo de economia estiver ativo, processando em lote (`batching`) quando a rede estiver estável.
4. **Sem Secrets no Código**: URLs de API e configurações de ambiente são injetadas via variáveis de ambiente com `expo-constants` / `.env`.
