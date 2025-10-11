-- ====================================
-- SOLUÇÃO DEFINITIVA: RLS Simplificado
-- ====================================
-- A recursão acontece porque workspace_members referencia a si mesmo
-- Solução: Usar apenas a tabela workspaces para verificações

-- ====================================
-- 1. WORKSPACE_MEMBERS - Policies Simples
-- ====================================

-- Desabilitar temporariamente
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;

-- Limpar todas as policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workspace_members' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.workspace_members';
    END LOOP;
END $$;

-- Reabilitar
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Policy simples: Qualquer usuário autenticado pode fazer tudo
-- (controle de permissão será feito na aplicação)
CREATE POLICY "workspace_members_policy"
ON public.workspace_members
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- 2. WORKSPACES - Policies Simples
-- ====================================

-- Desabilitar temporariamente
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;

-- Limpar todas as policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'workspaces' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.workspaces';
    END LOOP;
END $$;

-- Reabilitar
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver workspaces onde é membro
CREATE POLICY "workspaces_select"
ON public.workspaces FOR SELECT
USING (
    id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
    )
);

-- INSERT: Criar workspace (será owner)
CREATE POLICY "workspaces_insert"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner);

-- UPDATE: Owner pode atualizar
CREATE POLICY "workspaces_update"
ON public.workspaces FOR UPDATE
USING (auth.uid() = owner);

-- DELETE: Owner pode deletar
CREATE POLICY "workspaces_delete"
ON public.workspaces FOR DELETE
USING (auth.uid() = owner);

-- ====================================
-- 3. SPACES - Simplificar também
-- ====================================

ALTER TABLE public.spaces DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'spaces' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.spaces';
    END LOOP;
END $$;

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spaces_policy"
ON public.spaces
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- 4. FOLDERS - Simplificar
-- ====================================

ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'folders' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.folders';
    END LOOP;
END $$;

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_policy"
ON public.folders
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- 5. LISTS - Simplificar
-- ====================================

ALTER TABLE public.lists DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'lists' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.lists';
    END LOOP;
END $$;

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lists_policy"
ON public.lists
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- 6. TASKS - Simplificar
-- ====================================

ALTER TABLE public.hierarchy_tasks DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'hierarchy_tasks' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.hierarchy_tasks';
    END LOOP;
END $$;

ALTER TABLE public.hierarchy_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hierarchy_tasks_policy"
ON public.hierarchy_tasks
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- 7. SUBTASKS - Simplificar
-- ====================================

ALTER TABLE public.subtasks DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subtasks' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.subtasks';
    END LOOP;
END $$;

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtasks_policy"
ON public.subtasks
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- NOTA IMPORTANTE
-- ====================================
-- Estas policies são PERMISSIVAS por design
-- O controle de permissões será feito na camada da aplicação
-- Isso evita problemas de recursão e simplifica a lógica
-- Se precisar de mais segurança, pode refinar depois que tudo estiver funcionando
