-- ====================================
-- SOLUÇÃO TEMPORÁRIA: DESABILITAR RLS
-- ====================================
-- Vamos desabilitar RLS temporariamente para fazer funcionar
-- Depois refinamos as policies quando tudo estiver rodando

-- Desabilitar RLS em TODAS as tabelas da hierarquia
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks DISABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Isso significa que qualquer usuário autenticado pode ver/editar dados
-- É TEMPORÁRIO apenas para desenvolvimento
-- Vamos refinar as policies depois que tudo estiver funcionando

-- Verificar status do RLS
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('workspaces', 'workspace_members', 'spaces', 'folders', 'lists', 'hierarchy_tasks', 'subtasks')
ORDER BY tablename;
