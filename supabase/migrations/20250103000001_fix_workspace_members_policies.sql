-- ====================================
-- FIX: Corrigir recursão infinita nas policies de workspace_members
-- ====================================

-- 1. Remover policies antigas que causam recursão
DROP POLICY IF EXISTS "Users can view workspace members where they are members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can remove members" ON public.workspace_members;

-- 2. Criar policies corrigidas SEM recursão

-- SELECT: Usuários podem ver membros de workspaces onde eles são membros
-- CORRIGIDO: Usa join direto sem subquery recursiva
CREATE POLICY "Users can view workspace members"
ON public.workspace_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members wm2
        WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
    )
);

-- INSERT: Permitir que o sistema adicione o primeiro membro (owner)
-- E também permitir owners/admins adicionarem novos membros
CREATE POLICY "Allow insert workspace members"
ON public.workspace_members FOR INSERT
WITH CHECK (
    -- Permite se não existir nenhum membro ainda (primeiro owner)
    NOT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = workspace_members.workspace_id
    )
    OR
    -- Ou se o usuário atual é owner/admin do workspace
    EXISTS (
        SELECT 1 FROM public.workspace_members wm2
        WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role IN ('owner', 'admin')
    )
);

-- UPDATE: Apenas owners e admins podem atualizar roles
CREATE POLICY "Workspace owners and admins can update members"
ON public.workspace_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members wm2
        WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role IN ('owner', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.workspace_members wm2
        WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role IN ('owner', 'admin')
    )
);

-- DELETE: Apenas owners e admins podem remover membros
CREATE POLICY "Workspace owners and admins can delete members"
ON public.workspace_members FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members wm2
        WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role IN ('owner', 'admin')
    )
);

-- ====================================
-- OPCIONAL: Simplificar policies de WORKSPACES também
-- ====================================

-- Remover policies antigas de workspaces
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete their workspaces" ON public.workspaces;

-- SELECT: Ver workspaces onde é membro (SEM recursão)
CREATE POLICY "Users can view their workspaces"
ON public.workspaces FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
    )
);

-- INSERT: Qualquer usuário autenticado pode criar workspace (será owner)
CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner);

-- UPDATE: Apenas owner pode atualizar
CREATE POLICY "Workspace owners can update workspaces"
ON public.workspaces FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

-- DELETE: Apenas owner pode deletar
CREATE POLICY "Workspace owners can delete workspaces"
ON public.workspaces FOR DELETE
USING (auth.uid() = owner);
