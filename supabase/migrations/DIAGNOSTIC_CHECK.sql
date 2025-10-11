-- ====================================
-- DIAGNÓSTICO COMPLETO DO BANCO
-- ====================================
-- Execute cada seção separadamente para investigar

-- ====================================
-- 1. VERIFICAR POLICIES ATIVAS
-- ====================================
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
AND tablename IN ('workspaces', 'workspace_members')
ORDER BY tablename, policyname;

-- ====================================
-- 2. VERIFICAR RLS HABILITADO
-- ====================================
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('workspaces', 'workspace_members', 'spaces', 'folders', 'lists', 'hierarchy_tasks', 'subtasks');

-- ====================================
-- 3. VERIFICAR ESTRUTURA DA TABELA WORKSPACES
-- ====================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'workspaces'
ORDER BY ordinal_position;

-- ====================================
-- 4. VERIFICAR auth.uid()
-- ====================================
SELECT auth.uid() as current_user_id;

-- ====================================
-- 5. VERIFICAR DADOS EXISTENTES
-- ====================================
SELECT COUNT(*) as total_workspaces FROM public.workspaces;
SELECT COUNT(*) as total_members FROM public.workspace_members;

-- ====================================
-- 6. TESTAR INSERÇÃO MANUAL (SEM RLS)
-- ====================================
-- NÃO EXECUTE AINDA - apenas para referência
/*
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;

INSERT INTO public.workspaces (name, owner)
VALUES ('Teste', auth.uid())
RETURNING *;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
*/
