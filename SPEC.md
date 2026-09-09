# Product Specification — LarviFort Mobile CRM

## 1. Visão Geral e Objetivo do Produto

O **LarviFort Mobile** é a aplicação móvel complementar ao **LarviFort CRM**, projetada especificamente para atender operadores, técnicos e consultores de campo que atuam em áreas rurais e remotas (interior, fazendas, viveiros de carcinicultura e piscicultura). 

O foco principal do app é proporcionar uma experiência ágil, simplificada e **100% Offline-First** para gestão operacional através do **quadro de tarefas (Kanban)**, permitindo visualização de projetos/setores, criação e edição de tarefas, movimentação de status, atualização de progresso e registro de evidências/anexos mesmo sem qualquer conectividade de internet por horas ou dias, sincronizando automaticamente de forma confiável assim que o dispositivo recuperar conexão.

---

## 2. Personas e Cenário de Uso em Campo

- **Técnico / Consultor de Campo**: Passa o dia em visitas a fazendas e viveiros com sinal de celular oscilante ou inexistente. Precisa abrir o aplicativo instantaneamente, consultar as tarefas do setor operacional/comercial, mover cards no Kanban, atualizar o percentual de conclusão de uma vistoria e criar novas pendências com fotos tiradas na hora.
- **Gestor / Coordenador Operacional**: Acompanha tarefas atribuídas aos membros da equipe, filtra por setor (Comercial, Operações, Desenvolvimento, Administrativo, Financeiro) e confere o status de sincronização de dados enviados da equipe de campo.

---

## 3. Requisitos Funcionais (RF)

### 3.1. Autenticação e Sessão Offline
- **RF-01 (Login Online com Cache de Sessão)**: Autenticação via e-mail e senha consumindo o endpoint `/auth/login` da `lavifort-API`. Ao logar com sucesso, armazena JWT e perfil do usuário em storage seguro (`Expo SecureStore`).
- **RF-02 (Persistência e Acesso Offline)**: Se o usuário estiver sem internet ao abrir o aplicativo, a sessão armazenada deve ser validada localmente permitindo acesso irrestrito aos dados em cache sem bloqueio por falta de rede.
- **RF-03 (Logout Seguro)**: Logout limpa credenciais seguras e reseta o cache local após confirmação ou sincronização de pendências.

### 3.2. Quadro Kanban & Gestão de Tarefas
- **RF-04 (Seleção de Projetos/Setores)**: Seletor superior para alternar entre setores/projetos (Comercial, Financeiro, Desenvolvimento, Operações, Administrativo ou projetos dinâmicos retornados pela API).
- **RF-05 (Visualização Kanban Adaptada ao Mobile)**: 
  - Visualização em colunas por abas deslizáveis (Tabs/Swipeable) ou rolagem horizontal suave com snapping das colunas: `BACKLOG`, `EM ANDAMENTO`, `EM REVISÃO`, `CONCLUÍDO`.
  - Opção de alternância rápida entre modo **Kanban** e modo **Lista Compacta**.
  - Contadores de itens por coluna e indicadores visuais de status.
- **RF-06 (Cards de Tarefa)**:
  - Exibição de: Título da tarefa, tag de prioridade (`ALTA`, `MEDIA`, `BAIXA`), barra de progresso visual (0–100%), avatar/iniciais do responsável (`assignee`), data de entrega/prazo (`prazo`) e badge de sincronização (se estiver pendente de envio).
- **RF-07 (Criação Rápida de Tarefas)**:
  - Botão flutuante (FAB) de criação rápida com campos: Título, Projeto/Setor, Status inicial, Prioridade, Responsável, Prazo e Descrição opcional.
  - Disponível totalmente offline com geração de UUID v4 client-side imediato.
- **RF-08 (Edição e Atualização de Tarefas)**:
  - Alteração de status com 1 toque (menu rápido de mover ou arrastar).
  - Slider/stepper para ajuste ágil de progresso (0% a 100%).
  - Edição de título, descrição, prioridade, responsável e prazo.
- **RF-09 (Transferência e Subtarefas)**:
  - Suporte a mover tarefa para outro setor/quadro ou transformar em subtarefa (`transferTask`).
- **RF-10 (Anexos e Fotos de Campo)**:
  - Captura de fotos diretamente da câmera do celular ou galeria.
  - Imagens salvas localmente em disco do app (`expo-file-system`) e enfileiradas na fila de upload.

### 3.3. Motor Offline-First & Sincronização (Sync Engine)
- **RF-11 (Armazenamento Local)**: Todos os projetos, colunas, tarefas e mutações pendentes são armazenados localmente (SQLite / WatermelonDB / AsyncStorage persistente).
- **RF-12 (Optimistic UI & Fila Outbox)**:
  - Toda ação de escrita (criar, editar, alterar status, mover, deletar) atualiza o banco/estado local instantaneamente na UI e registra uma mutação na fila `outbox`.
- **RF-13 (Monitoramento de Conectividade e Auto-Sync)**:
  - Monitoramento contínuo de rede via `NetInfo`.
  - Quando a conexão é restabelecida, o sync engine processa sequencialmente as mutações da outbox contra os endpoints correspondentes da API (`/tasks`, `/tasks/:id/status`, etc.).
- **RF-14 (Resolução de Conflitos)**:
  - Estratégia de resolução: *Last-Write-Wins* baseada no timestamp da mutação local para campos atômicos, preservando a integridade da fila.
- **RF-15 (Indicador Visual de Status de Rede e Sincronização)**:
  - Banner discreto no topo: "Modo Offline — 3 alterações locais pendentes", "Sincronizando dados...", "Todas as alterações sincronizadas".

---

## 4. Requisitos Não Funcionais (RNF)

- **RNF-01 (Performance & Latência Zero)**: Interações de criação, edição e transição de status devem responder em < 16ms na UI (60/120fps), sem esperar chamadas de rede.
- **RNF-02 (Design System & Consistência com o Web)**:
  - Paleta de cores corporativa LarviFort:
    - Primária: Azul Brand (`#0284c7`, `#0ea5e9`, `#0369a1`).
    - Neutros: Fundo de tela `#fcfcfd`, cards `#ffffff`, bordas `#e5e7eb`, texto primário `#0f172a`, secundário `#64748b`.
    - Status: Backlog (`slate`), Em Andamento (`sky`), Em Revisão (`amber`), Concluído (`emerald`).
    - Prioridades: Alta (`red/rose`), Média (`amber`), Baixa (`emerald/slate`).
  - Tipografia: Inter / San Francisco / Roboto, tamanhos legíveis sob luz solar direta em campo.
  - Alvos de toque acessíveis (mínimo de 44x44 dp para botões e cards).
- **RNF-03 (Compatibilidade de Plataforma)**: Suporte a iOS (15+) e Android (API level 26+), rodando via Expo SDK 52+ / React Native.
- **RNF-04 (Tolerância a Falhas e Armazenamento Seguro)**: Persistência não-volátil garantindo que o app possa ser fechado ou o dispositivo desligado sem perder tarefas criadas em modo offline.

---

## 5. Critérios de Aceitação (DoD - Definition of Done)

1. **Autenticação**:
   - Usuário consegue fazer login com conexão e obter JWT.
   - Após fechar o app e desconectar a internet, reabrir o app mantém o usuário logado com seus dados operacionais disponíveis.
2. **Kanban e Tarefas Offline**:
   - Com o celular em Modo Avião (offline), o usuário consegue criar uma nova tarefa, alterar o status de "BACKLOG" para "EM ANDAMENTO", ajustar progresso para 75% e anexar uma foto.
   - Os cards refletem as alterações imediatamente na interface.
3. **Sincronização**:
   - Ao desativar o Modo Avião (online), o sync engine envia todas as requisições pendentes na ordem correta para a `lavifort-API`.
   - A tarefa criada aparece no banco de dados e no frontend web `larvifort-crm`.
   - O indicador de sincronização muda de "Pendente" para "Sincronizado".
4. **Alinhamento de Design**:
   - As cores, badges e estados visuais seguem exatamente o padrão de tokens do `larvifort-crm`.
5. **Qualidade de Código & Verificação**:
   - Testes unitários para o Sync Engine e repositórios locais.
   - Script `./scripts/verify.sh` executa `typecheck`, `lint` e `test` com zero erros.
