# Architectural Decisions — LarviFort Mobile CRM

## DEC-001: Padrão Offline-First com Fila Outbox (FIFO)
- **Data**: 2026-09-09
- **Contexto**: O aplicativo é utilizado em áreas rurais e remotas onde a conexão com a internet é intermitente ou inexistente por períodos prolongados.
- **Decisão**: A interface do usuário opera sempre contra o banco de dados/estado local. Qualquer operação de escrita (criação, edição, movimentação de status, exclusão) é aplicada instantaneamente no armazenamento local (Optimistic UI) e registrada na fila `OutboxQueue`. Ao restabelecer a conexão, o `Sync Engine` drena a outbox em ordem cronológica (FIFO) executando as requisições HTTP contra a `lavifort-API`.
- **Consequências**: Latência zero para o operador em campo; resiliência total contra perda de dados; simplificação da lógica de telas, que não dependem do status de rede para funcionar.

## DEC-002: Fidelidade ao Design System do LarviFort Web
- **Data**: 2026-09-09
- **Contexto**: O operador e gestores utilizam tanto a versão web (`larvifort-crm`) quanto a versão mobile.
- **Decisão**: Manter estrita consistência visual com os tokens definidos no CRM web:
  - Brand 600: `#0284c7`
  - Fundo neutro: `#fcfcfd`, Cards: `#ffffff`, Bordas: `#e5e7eb`
  - Cores semânticas de status: `BACKLOG` (Slate), `EM_ANDAMENTO` (Sky), `EM_REVISAO` (Amber), `CONCLUIDO` (Emerald).
  - Tipografia limpa, botões com alvos táteis mínimos de 44x44 dp.

## DEC-003: Compatibilidade Total com os Endpoints da `lavifort-API`
- **Data**: 2026-09-09
- **Contexto**: A `lavifort-API` já atende o `larvifort-crm` através das rotas `/tasks`, `/tasks/projects`, `/tasks/:id/status`, `/tasks/:id/transfer` e `/auth/login`.
- **Decisão**: O app mobile não criará rotas exclusivas no backend; consumirá os mesmos contratos REST existentes, normalizando respostas com envelopes `{ data }` ou arrays diretos da mesma forma que o frontend web.

## DEC-004: Geração de Identificadores (UUID) Client-Side
- **Data**: 2026-09-09
- **Contexto**: Em modo offline, tarefas precisam ser criadas com identificadores únicos sem aguardar retorno do backend.
- **Decisão**: Utilizar geração de UUID v4 no próprio cliente móvel no momento da criação da tarefa. O backend aceita ou mapeia o ID gerado na criação.

## DEC-005: Armazenamento e Upload de Anexos/Fotos Offline-First
- **Data**: 2026-09-09
- **Contexto**: Técnicos e consultores em campo registram fotos de laudos e viveiros sem conexão com a internet.
- **Decisão**: Salvar cópia local do arquivo via `expo-file-system` no diretório de documentos/cache do dispositivo imediatamente após a captura (`expo-image-picker`), indexar o anexo na tarefa localmente com status `PENDING` e enfileirar mutação `UPLOAD_ATTACHMENT` na `OutboxQueue`. O `Sync Engine` realiza o upload multipart/form-data assim que a conectividade for restabelecida e atualiza o status para `SYNCED`.

## DEC-006: Painel de Inspeção e Controle Manual da Fila Outbox
- **Data**: 2026-09-09
- **Contexto**: Em operações de campo, o técnico precisa ter visibilidade total das operações pendentes na fila local, status de rede e possíveis erros de conflito com o servidor.
- **Decisão**: Criar tela dedicada `/sync-status` conectada ao `useSyncStore` e `OutboxQueue`, permitindo visualização de métricas (total, pendentes, erros), filtragem por abas, inspeção de mensagens de erro do servidor por mutação, acionamento de sincronização manual, reprocessamento individual/global de erros e descarte de mutações.
