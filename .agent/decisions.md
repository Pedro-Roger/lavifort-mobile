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

## DEC-007: ActivitiesScreen com fluxo direto (alinhamento TechLead 2026-09-27)
- **Data**: 2026-09-27
- **Contexto**: O operador de campo precisa confirmar execução de atividades (tasks tipo COMPROMISSO) com o menor atrito possível. Seleção de progresso intermediário ('Iniciar' / 'Em andamento') adicionava toques sem valor operacional.
- **Decisão**: Tela `/atividades` com fluxo direto — estados terminais Concluir / Não executada, sem UI intermediária; filtros simplificados (Todas / Não executadas / Concluídas). "Não executada" é estado de filtro (o backend não expõe mutação correspondente; só `POST /tasks/:id/confirm-activity`). Concluir = check-in com geolocalização (`expo-location`, exigido pelo contrato: latitude/longitude/accuracyMeters obrigatórios; permissão iOS `NSLocationWhenInUseUsageDescription`).
- **Consequências**: Dependência `expo-location@~18.0.10` adicionada (motivo claro: contrato do backend); `Task` estendido com `tipo?`/`confirmation?` opcionais; Kanban de 4 status e TaskDetailModal NÃO alterados (fluxo de tarefas gerais preservado).

## DEC-008: Carteira por região + Check-in GPS na fazenda (Task 1.2, 2026-09-28)
- **Data**: 2026-09-28
- **Contexto**: A vendedora precisa da carteira de clientes filtrada pela própria região e de registrar presença nas fazendas com GPS. O backend (Task 1.1) ainda NÃO expõe `GET /regions` nem endpoint de check-in de cliente/fazenda; o único contrato de check-in real do web é `PATCH /appointments/:id/checkin`.
- **Decisão**:
  - `regions.service.ts`: consumir `GET /regions` com **fallback offline** para `DEFAULT_REGIONS` (Polo Vale do Ribeira, Polo Oeste, Litoral Leste, Morada Nova — mesmos nomes do protótipo). A carteira funciona mesmo antes do endpoint existir.
  - Filtro da carteira por região é **client-side** por `uf`/`cidade` do `Cliente` (o modelo não tem campo região).
  - `checkin.service.ts`: verificação por **geofence** (centro + raio, haversine); registro local offline-first em AsyncStorage (`recordCheckin`); sync de registros vinculados a compromisso via `PATCH /appointments/:id/checkin`; visitas de fazenda sem vínculo ficam como `LOCAL` (CRM diário simplificado).
  - Telas `/carteira` e `/checkin` seguem os tokens do design system e targets ≥44dp. Rotas no `_layout` + launcher `/modules`.
- **Consequências**: Nenhum endpoint inventado; sem alteração no sync engine principal (evita regressão nos testes existentes). Quando o backend entregar `/regions` com centro/raio, o geofence passa a validar com precisão de verdade; hoje valida por uf/cidade + fallback. `App` ganhou permissões Android de localização (`ACCESS_FINE/COARSE_LOCATION`).

## DEC-009: Rodada corretiva (QA) — contrato real de regions/clients + limpeza de arquivos soltos (2026-09-28)
- **Data**: 2026-09-28
- **Contexto**: QA não aprovou o entregável 1.2 porque o backend passou a entregar o contrato real: `GET /regions` retorna `Paginated<Region>` com `centerLat/centerLng/radiusKm` opcionais (nullable), e o `Cliente` agora tem `status: 'ativo'|'inativo'` (separado de `statusLead`) além de `regiaoId`. Também apontou arquivos soltos de outro agente (regiões hardcoded + GPS mockado) como não desplegáveis.
- **Decisão**:
  - **Geofence real**: `Region` (mobile) mudou para `centerLat/centerLng/radiusKm: number | null`. `verifyRegion` (`checkin.service.ts`) VALIDA por raio em km quando as coordenadas estão presentes; quando `null`, assume válida (fallback por uf/cidade na carteira). `normalizeRegion` (`regions.service.ts`) agora lê `centerLat/centerLng/radiusKm` opcionais (+ `descricao/vendedoraId/ativa`).
  - **Status do cliente**: `Cliente` ganhou `status?: 'ativo'|'inativo'` e `regiaoId?`. `regions.service.ts` ganhou `isActiveClient` e `filterCarteira` (só clientes ATIVOS da região). `clientBelongsToRegion` prioriza o vínculo real `regiaoId`, com fallback uf/cidade. `/carteira` e `/checkin` usam `filterCarteira`.
  - **Arquivos soltos**: `src/app/cadastro-cliente.tsx` e `src/hooks/useCadastroCliente.ts` ELIMINADOS — protótipo não desplegável (regiões hardcoded, GPS mockado, campos `ativo boolean`/`cotaBonificacaoMensal` que não correspondem ao novo contrato `status`/`regiaoId`, `@react-native-picker/picker` não instalado, sem rota). Não existe `cadastro-cliente.service.ts`. O hook não era reutilizável no estado mock/hardcoded.
- **Consequências**: O geofence agora valida com os valores reais da API; queda para uf/cidade só quando a região não traz coordenadas. Carteira e check-in listam apenas clientes ativos da região. `verify.sh` VERDE (47 suites / 315 testes).
