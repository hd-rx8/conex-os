-- ====================================
-- SOLUÇÃO DEFINITIVA - RLS CORRETO
-- ====================================
-- IMPORTANTE: Execute este arquivo COMPLETO de uma vez

-- ====================================
-- PASSO 1: DESABILITAR RLS EM TODAS AS TABELAS
-- ====================================
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks DISABLE ROW LEVEL SECURITY;

-- ====================================
-- PASSO 2: REMOVER TODAS AS POLICIES EXISTENTES
-- ====================================

-- Workspaces
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workspaces' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.workspaces';
    END LOOP;
END $$;

-- Workspace Members
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workspace_members' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.workspace_members';
    END LOOP;
END $$;

-- Spaces
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'spaces' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.spaces';
    END LOOP;
END $$;

-- Folders
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'folders' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.folders';
    END LOOP;
END $$;

-- Lists
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'lists' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.lists';
    END LOOP;
END $$;

-- Hierarchy Tasks
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'hierarchy_tasks' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.hierarchy_tasks';
    END LOOP;
END $$;

-- Subtasks
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subtasks' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.subtasks';
    END LOOP;
END $$;

-- ====================================
-- PASSO 3: REABILITAR RLS
-- ====================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- ====================================
-- PASSO 4: CRIAR POLICIES CORRETAS
-- ====================================

-- ==================
-- WORKSPACES
-- ==================

-- SELECT: Ver workspaces onde sou membro
CREATE POLICY "workspaces_select_policy"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id = id
        AND wm.user_id = auth.uid()
    )
);

-- INSERT: Criar workspace (qualquer usuário autenticado)
CREATE POLICY "workspaces_insert_policy"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = owner
);

-- UPDATE: Apenas owner pode atualizar
CREATE POLICY "workspaces_update_policy"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

-- DELETE: Apenas owner pode deletar
CREATE POLICY "workspaces_delete_policy"
ON public.workspaces
FOR DELETE
TO authenticated
USING (auth.uid() = owner);

-- ==================
-- WORKSPACE_MEMBERS
-- ==================

-- SELECT: Ver membros dos meus workspaces
CREATE POLICY "workspace_members_select_policy"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
    workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner = auth.uid()
    )
);

-- INSERT: Owner do workspace ou service_role pode adicionar
CREATE POLICY "workspace_members_insert_policy"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
    workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner = auth.uid()
    )
);

-- UPDATE: Owner do workspace pode atualizar
CREATE POLICY "workspace_members_update_policy"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (
    workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner = auth.uid()
    )
);

-- DELETE: Owner do workspace pode deletar
CREATE POLICY "workspace_members_delete_policy"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
    workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner = auth.uid()
    )
);

-- ==================
-- DEMAIS TABELAS (PERMISSIVAS)
-- ==================

-- SPACES
CREATE POLICY "spaces_all_policy"
ON public.spaces
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- FOLDERS
CREATE POLICY "folders_all_policy"
ON public.folders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- LISTS
CREATE POLICY "lists_all_policy"
ON public.lists
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- HIERARCHY_TASKS
CREATE POLICY "hierarchy_tasks_all_policy"
ON public.hierarchy_tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- SUBTASKS
CREATE POLICY "subtasks_all_policy"
ON public.subtasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ====================================
-- PASSO 5: GRANT PERMISSIONS
-- ====================================

GRANT ALL ON public.workspaces TO authenticated;
GRANT ALL ON public.workspace_members TO authenticated;
GRANT ALL ON public.spaces TO authenticated;
GRANT ALL ON public.folders TO authenticated;
GRANT ALL ON public.lists TO authenticated;
GRANT ALL ON public.hierarchy_tasks TO authenticated;
GRANT ALL ON public.subtasks TO authenticated;

-- ====================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- ====================================

-- Listar todas as policies criadas
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('workspaces', 'workspace_members')
ORDER BY tablename, policyname;
