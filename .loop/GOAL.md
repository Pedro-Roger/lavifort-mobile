# LarviFort Mobile CRM — Objetivo do Projeto

Criar a aplicação móvel Offline-First em React Native (Expo) para operação de campo do LarviFort CRM, focada em gestão de tarefas e quadro Kanban adaptado para mobile, com suporte a trabalho sem conexão com a internet por horas/dias e sincronização automática com a lavifort-API.

## FASE 2 — Módulos Operacionais (Pendentes)

- [ ] MOB-019: Agenda, Empresas, Planejamento, Laboratório, Separação, Logística, Pós-venda, Fiscal, Métricas, Pesquisa, Equipe, Produtos/Unidades

## FASE 3 — Correções e Melhorias Pós-Production (Prioridade Média)

- [ ] MOB-020: Fix `parentTaskId` não sendo exibido nos badges de tarefas vinculadas — o badge de Card Pai deve mostrar o título e projeto do pai, não apenas o ID
- [ ] MOB-021: Fix Visual Workflow Canvas não renderizando conexões existentes ao carregar — o canvas deve carregar as arestas (conexões) já configuradas no backend
- [ ] MOB-022: Implementar preview de automação no builder mobile — ao selecionar gatilho e ação, mostrar preview de quais cards seriam afetados antes de salvar
- [ ] MOB-023: Implementar confirmação antes de executar automação que duplica cards cross-project — evitar duplicações acidentais em produção
- [ ] MOB-024: Fix builder de automações não ativa ao mover comercial→fechado duplicar card — a ação DUPLICATE_TO_PROJECT_COLUMN deve validar targetColumnId antes de executar
- [ ] MOB-025: Implementar indicador visual de status de sincronização de automações no canvas mobile — mostrar quais automações estão ativas, com erros ou desatualizadas
- [ ] MOB-026: Implementar export/import de configurações de automação mobile — permitir copiar automações entre projetos ou fazer backup das configurações
- [ ] MOB-027: Implementar teste de automação em modo seco (dry-run) no mobile — ao configurar uma automação, permitir simular sem executar de verdade
- [ ] MOB-028: Implementar histórico de execuções de automação no mobile — lista de últimas execuções com status, resultado e tempo de execução
- [ ] MOB-029: Implementar permissões de edição de automação por role no mobile — apenas ADMIN e gestores do projeto podem criar/editar automações
- [ ] MOB-030: Implementar notificação push quando automação falha após todos os retries — integrar com sistema de notificações do mobile (Expo Notifications)
- [ ] MOB-031: Implementar rate limiting visual no mobile — mostrar limite de execuções de automação por projeto e alertar quando próximo do limite

## Critérios de Conclusão da Fase 3

- Todas as automações configuradas via UI funcionam corretamente
- Os eventos do outbox são processados de forma idempotente e resiliente
- O mobile mantém paridade de funcionalidades com o web
- Offline-first: todas as operações funcionam sem conexão e sincronizam automaticamente
