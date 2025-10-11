-- Script de debug para verificar tarefas

-- 1. Verificar se a tabela tasks existe e tem RLS
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'tasks';

-- 2. Verificar policies da tabela tasks
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tasks';

-- 3. Contar total de tarefas
SELECT COUNT(*) as total_tasks FROM public.tasks;

-- 4. Ver todas as tarefas com seus relacionamentos
SELECT
    t.id,
    t.title,
    t.status,
    t.creator_id,
    t.assignee_id,
    t.list_id,
    l.name as list_name,
    l.space_id,
    s.name as space_name
FROM public.tasks t
LEFT JOIN public.lists l ON t.list_id = l.id
LEFT JOIN public.spaces s ON l.space_id = s.id
ORDER BY t.created_at DESC
LIMIT 10;

-- 5. Verificar se há listas disponíveis
SELECT
    l.id,
    l.name,
    l.space_id,
    s.name as space_name,
    COUNT(t.id) as task_count
FROM public.lists l
LEFT JOIN public.spaces s ON l.space_id = s.id
LEFT JOIN public.tasks t ON t.list_id = l.id
GROUP BY l.id, l.name, l.space_id, s.name
ORDER BY s.name, l.name;

-- 6. Verificar usuários
SELECT
    id,
    name,
    email
FROM public.app_users
LIMIT 5;
