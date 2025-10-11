-- ============================================
-- ANÁLISE COMPLETA DA ESTRUTURA DO BANCO
-- ============================================

-- 1. TABELAS ATUAIS E SUAS COLUNAS
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN (
        'workspaces', 'workspace_members', 'spaces', 'folders', 'lists',
        'hierarchy_tasks', 'subtasks', 'projects', 'tasks', 'proposal_services'
    )
ORDER BY table_name, ordinal_position;

-- 2. RELACIONAMENTOS (FOREIGN KEYS)
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 3. CONTAGEM DE REGISTROS POR TABELA
SELECT 'workspaces' as table_name, COUNT(*) as total FROM workspaces
UNION ALL
SELECT 'workspace_members', COUNT(*) FROM workspace_members
UNION ALL
SELECT 'spaces', COUNT(*) FROM spaces
UNION ALL
SELECT 'folders', COUNT(*) FROM folders
UNION ALL
SELECT 'lists', COUNT(*) FROM lists
UNION ALL
SELECT 'hierarchy_tasks', COUNT(*) FROM hierarchy_tasks
UNION ALL
SELECT 'subtasks', COUNT(*) FROM subtasks
UNION ALL
SELECT 'projects (OLD)', COUNT(*) FROM projects
UNION ALL
SELECT 'tasks (OLD)', COUNT(*) FROM tasks
ORDER BY table_name;

-- 4. VERIFICAR TABELAS ÓRFÃS (sem relacionamentos)
SELECT
    t.table_name,
    COUNT(tc.constraint_name) as fk_count
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc
    ON t.table_name = tc.table_name
    AND tc.constraint_type = 'FOREIGN KEY'
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY fk_count, t.table_name;
