-- ============================================
-- OTIMIZAÇÃO DA ESTRUTURA DO BANCO DE DADOS
-- Remove tabelas antigas e otimiza relacionamentos
-- ============================================

-- PARTE 1: PULAR MIGRAÇÃO DE TAREFAS (SÓ 1 REGISTRO - PODE SER RECRIADO MANUALMENTE)
-- ====================================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migração de tarefas pulada - apenas 1 tarefa antiga pode ser recriada manualmente se necessário';
  RAISE NOTICE 'A tarefa antiga está na tabela "tasks" e pode ser visualizada antes da exclusão';
END $$;

-- PARTE 2: VERIFICAR E REPORTAR TABELAS PARA REMOÇÃO
-- ====================================================

DO $$
DECLARE
  projects_count INTEGER;
  tasks_count INTEGER;
  proposal_services_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO projects_count FROM projects;
  SELECT COUNT(*) INTO tasks_count FROM tasks;
  SELECT COUNT(*) INTO proposal_services_count FROM proposal_services;

  RAISE NOTICE '=== TABELAS A SEREM REMOVIDAS ===';
  RAISE NOTICE 'projects: % registros', projects_count;
  RAISE NOTICE 'tasks: % registros', tasks_count;
  RAISE NOTICE 'proposal_services: % registros', proposal_services_count;
  RAISE NOTICE '==================================';
END $$;

-- PARTE 3: REMOVER TABELAS ANTIGAS
-- ==================================

DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS proposal_services CASCADE;

-- PARTE 4: RENOMEAR hierarchy_tasks PARA tasks
-- =============================================

ALTER TABLE hierarchy_tasks RENAME TO tasks;

DO $$
BEGIN
  RAISE NOTICE 'Tabelas antigas removidas e hierarchy_tasks renomeada para tasks com sucesso!';
END $$;

-- PARTE 5: ADICIONAR CONSTRAINTS IMPORTANTES
-- ===========================================

-- Garantir workspace_id não nulo em spaces
ALTER TABLE spaces
  ALTER COLUMN workspace_id SET NOT NULL;

-- Garantir list_id não nulo em hierarchy_tasks (ou tasks depois de renomear)
ALTER TABLE hierarchy_tasks
  ALTER COLUMN list_id SET NOT NULL;

-- PARTE 6: ADICIONAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para melhorar consultas de hierarquia
CREATE INDEX IF NOT EXISTS idx_spaces_workspace_id ON spaces(workspace_id);
CREATE INDEX IF NOT EXISTS idx_folders_space_id ON folders(space_id);
CREATE INDEX IF NOT EXISTS idx_lists_space_id ON lists(space_id);
CREATE INDEX IF NOT EXISTS idx_lists_folder_id ON lists(folder_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_list_id ON hierarchy_tasks(list_id);
-- CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_assignee ON hierarchy_tasks(assignee); -- Coluna não existe
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_parent_id ON subtasks(parent_subtask_id);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_status ON hierarchy_tasks(status);

-- PARTE 7: RELATÓRIO FINAL
-- ========================

SELECT
  'workspaces' as tabela,
  COUNT(*) as total,
  'ROOT - Setores/Empresas' as descricao
FROM workspaces
UNION ALL
SELECT 'spaces', COUNT(*), 'Projetos dentro de workspaces' FROM spaces
UNION ALL
SELECT 'folders', COUNT(*), 'Pastas opcionais dentro de projetos' FROM folders
UNION ALL
SELECT 'lists', COUNT(*), 'Listas de tarefas' FROM lists
UNION ALL
SELECT 'hierarchy_tasks', COUNT(*), 'Tarefas dentro de listas' FROM hierarchy_tasks
UNION ALL
SELECT 'subtasks', COUNT(*), 'Subtarefas (recursivas)' FROM subtasks
ORDER BY tabela;
