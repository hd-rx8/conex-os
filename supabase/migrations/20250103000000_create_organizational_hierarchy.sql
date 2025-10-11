-- ====================================
-- HIERARQUIA ORGANIZACIONAL - 6 NÍVEIS
-- ====================================
-- 1. Workspaces (Organização)
-- 2. Spaces (Departamentos/Equipes)
-- 3. Folders (Agrupador opcional de projetos)
-- 4. Lists (Lista de tarefas)
-- 5. Tasks (Tarefa individual)
-- 6. Subtasks (Decomposição de tarefa - aninhamento infinito)

-- ====================================
-- 1. WORKSPACES (Nível mais alto)
-- ====================================
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- emoji ou ícone
    color TEXT, -- cor hexadecimal
    owner UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de membros do workspace (múltiplos usuários por workspace)
CREATE TABLE public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);

-- ====================================
-- 2. SPACES (Departamentos/Equipes)
-- ====================================
CREATE TABLE public.spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    -- Configurações herdáveis
    custom_statuses JSONB DEFAULT '[]'::jsonb, -- [{name: "Em Análise", color: "#FF5733"}]
    position INTEGER NOT NULL DEFAULT 0, -- ordem de exibição
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_spaces_workspace_id ON public.spaces(workspace_id);
CREATE INDEX idx_spaces_position ON public.spaces(workspace_id, position);

-- ====================================
-- 3. FOLDERS (Agrupador opcional)
-- ====================================
CREATE TABLE public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    -- Herda custom_statuses do Space, mas pode sobrescrever
    custom_statuses JSONB, -- se NULL, herda do space
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_folders_space_id ON public.folders(space_id);
CREATE INDEX idx_folders_position ON public.folders(space_id, position);

-- ====================================
-- 4. LISTS (Listas de tarefas)
-- ====================================
CREATE TABLE public.lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE, -- OPCIONAL
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    -- Herda custom_statuses do Folder (se existir) ou Space
    custom_statuses JSONB, -- se NULL, herda
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraint: list deve estar em um space, folder é opcional
    CONSTRAINT list_must_have_space CHECK (space_id IS NOT NULL)
);

CREATE INDEX idx_lists_space_id ON public.lists(space_id);
CREATE INDEX idx_lists_folder_id ON public.lists(folder_id);
CREATE INDEX idx_lists_position ON public.lists(space_id, folder_id, position);

-- ====================================
-- 5. TASKS (Tarefas)
-- ====================================
CREATE TABLE public.hierarchy_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente',
    priority TEXT DEFAULT 'Média' CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Urgente')),
    due_date DATE,
    assignee_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    -- Campos adicionais
    tags TEXT[], -- array de tags
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_hierarchy_tasks_list_id ON public.hierarchy_tasks(list_id);
CREATE INDEX idx_hierarchy_tasks_assignee_id ON public.hierarchy_tasks(assignee_id);
CREATE INDEX idx_hierarchy_tasks_status ON public.hierarchy_tasks(status);
CREATE INDEX idx_hierarchy_tasks_position ON public.hierarchy_tasks(list_id, position);

-- ====================================
-- 6. SUBTASKS (Aninhamento infinito)
-- ====================================
CREATE TABLE public.subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.hierarchy_tasks(id) ON DELETE CASCADE,
    parent_subtask_id UUID REFERENCES public.subtasks(id) ON DELETE CASCADE, -- permite aninhamento
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente',
    assignee_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    due_date DATE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX idx_subtasks_parent_id ON public.subtasks(parent_subtask_id);
CREATE INDEX idx_subtasks_position ON public.subtasks(task_id, parent_subtask_id, position);

-- ====================================
-- TRIGGERS para updated_at
-- ====================================
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at
BEFORE UPDATE ON public.spaces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
BEFORE UPDATE ON public.lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hierarchy_tasks_updated_at
BEFORE UPDATE ON public.hierarchy_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at
BEFORE UPDATE ON public.subtasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================
-- TRIGGER para completed_at
-- ====================================
CREATE OR REPLACE FUNCTION public.update_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Concluída' AND OLD.status != 'Concluída' THEN
        NEW.completed_at = now();
    ELSIF NEW.status != 'Concluída' AND OLD.status = 'Concluída' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hierarchy_tasks_completed_at
BEFORE UPDATE ON public.hierarchy_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_completed_at();

CREATE TRIGGER update_subtasks_completed_at
BEFORE UPDATE ON public.subtasks
FOR EACH ROW EXECUTE FUNCTION public.update_completed_at();

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- ====================================
-- POLICIES - WORKSPACES
-- ====================================
-- Usuários podem ver workspaces onde são membros
CREATE POLICY "Users can view workspaces they are members of"
ON public.workspaces FOR SELECT
USING (
    id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner);

CREATE POLICY "Workspace owners can update their workspaces"
ON public.workspaces FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "Workspace owners can delete their workspaces"
ON public.workspaces FOR DELETE
USING (auth.uid() = owner);

-- ====================================
-- POLICIES - WORKSPACE MEMBERS
-- ====================================
CREATE POLICY "Users can view workspace members where they are members"
ON public.workspace_members FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Workspace owners and admins can add members"
ON public.workspace_members FOR INSERT
WITH CHECK (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Workspace owners and admins can update members"
ON public.workspace_members FOR UPDATE
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Workspace owners and admins can remove members"
ON public.workspace_members FOR DELETE
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- ====================================
-- POLICIES - SPACES
-- ====================================
CREATE POLICY "Users can view spaces in their workspaces"
ON public.spaces FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Workspace members can create spaces"
ON public.spaces FOR INSERT
WITH CHECK (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace members can update spaces"
ON public.spaces FOR UPDATE
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace owners and admins can delete spaces"
ON public.spaces FOR DELETE
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- ====================================
-- POLICIES - FOLDERS
-- ====================================
CREATE POLICY "Users can view folders in their workspaces"
ON public.folders FOR SELECT
USING (
    space_id IN (
        SELECT s.id FROM public.spaces s
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid()
    )
);

CREATE POLICY "Workspace members can create folders"
ON public.folders FOR INSERT
WITH CHECK (
    space_id IN (
        SELECT s.id FROM public.spaces s
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace members can update folders"
ON public.folders FOR UPDATE
USING (
    space_id IN (
        SELECT s.id FROM public.spaces s
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace members can delete folders"
ON public.folders FOR DELETE
USING (
    space_id IN (
        SELECT s.id FROM public.spaces s
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

-- ====================================
-- POLICIES - LISTS
-- ====================================
CREATE POLICY "Users can view lists in their workspaces"
ON public.lists FOR SELECT
USING (
    space_id IN (
        SELECT s.id FROM public.spaces s
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid()
    )
);

CREATE POLICY "Workspace members can create lists"
ON public.lists FOR INSERT
WITH CHECK (
    space_id IN (
        SELECT s.id FROM public.spaces s
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace members can update lists"
ON public.lists FOR UPDATE
USING (
    space_id IN (
        SELECT s.id FROM public.spaces s
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace members can delete lists"
ON public.lists FOR DELETE
USING (
    space_id IN (
        SELECT s.id FROM public.spaces s
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

-- ====================================
-- POLICIES - TASKS
-- ====================================
CREATE POLICY "Users can view tasks in their workspaces"
ON public.hierarchy_tasks FOR SELECT
USING (
    list_id IN (
        SELECT l.id FROM public.lists l
        INNER JOIN public.spaces s ON s.id = l.space_id
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid()
    )
);

CREATE POLICY "Workspace members can create tasks"
ON public.hierarchy_tasks FOR INSERT
WITH CHECK (
    list_id IN (
        SELECT l.id FROM public.lists l
        INNER JOIN public.spaces s ON s.id = l.space_id
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace members can update tasks"
ON public.hierarchy_tasks FOR UPDATE
USING (
    list_id IN (
        SELECT l.id FROM public.lists l
        INNER JOIN public.spaces s ON s.id = l.space_id
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace members can delete tasks"
ON public.hierarchy_tasks FOR DELETE
USING (
    list_id IN (
        SELECT l.id FROM public.lists l
        INNER JOIN public.spaces s ON s.id = l.space_id
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

-- ====================================
-- POLICIES - SUBTASKS
-- ====================================
CREATE POLICY "Users can view subtasks in their workspaces"
ON public.subtasks FOR SELECT
USING (
    task_id IN (
        SELECT ht.id FROM public.hierarchy_tasks ht
        INNER JOIN public.lists l ON l.id = ht.list_id
        INNER JOIN public.spaces s ON s.id = l.space_id
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid()
    )
);

CREATE POLICY "Workspace members can create subtasks"
ON public.subtasks FOR INSERT
WITH CHECK (
    task_id IN (
        SELECT ht.id FROM public.hierarchy_tasks ht
        INNER JOIN public.lists l ON l.id = ht.list_id
        INNER JOIN public.spaces s ON s.id = l.space_id
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace members can update subtasks"
ON public.subtasks FOR UPDATE
USING (
    task_id IN (
        SELECT ht.id FROM public.hierarchy_tasks ht
        INNER JOIN public.lists l ON l.id = ht.list_id
        INNER JOIN public.spaces s ON s.id = l.space_id
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Workspace members can delete subtasks"
ON public.subtasks FOR DELETE
USING (
    task_id IN (
        SELECT ht.id FROM public.hierarchy_tasks ht
        INNER JOIN public.lists l ON l.id = ht.list_id
        INNER JOIN public.spaces s ON s.id = l.space_id
        INNER JOIN public.workspace_members wm ON wm.workspace_id = s.workspace_id
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin', 'member')
    )
);

-- ====================================
-- VIEWS ÚTEIS
-- ====================================

-- View para obter hierarquia completa de uma task
CREATE OR REPLACE VIEW public.task_hierarchy AS
SELECT
    ht.id as task_id,
    ht.title as task_title,
    l.id as list_id,
    l.name as list_name,
    f.id as folder_id,
    f.name as folder_name,
    s.id as space_id,
    s.name as space_name,
    w.id as workspace_id,
    w.name as workspace_name
FROM public.hierarchy_tasks ht
INNER JOIN public.lists l ON l.id = ht.list_id
LEFT JOIN public.folders f ON f.id = l.folder_id
INNER JOIN public.spaces s ON s.id = l.space_id
INNER JOIN public.workspaces w ON w.id = s.workspace_id;

-- View para contagem de tarefas por lista
CREATE OR REPLACE VIEW public.list_task_counts AS
SELECT
    l.id as list_id,
    l.name as list_name,
    COUNT(ht.id) as total_tasks,
    COUNT(CASE WHEN ht.status = 'Concluída' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN ht.status != 'Concluída' THEN 1 END) as pending_tasks
FROM public.lists l
LEFT JOIN public.hierarchy_tasks ht ON ht.list_id = l.id
GROUP BY l.id, l.name;

-- ====================================
-- FUNÇÕES AUXILIARES
-- ====================================

-- Função para obter status herdados (com fallback)
CREATE OR REPLACE FUNCTION public.get_inherited_statuses(p_list_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_statuses JSONB;
    v_folder_id UUID;
    v_space_id UUID;
BEGIN
    -- Pega os IDs necessários
    SELECT folder_id, space_id INTO v_folder_id, v_space_id
    FROM public.lists WHERE id = p_list_id;

    -- Tenta pegar do list primeiro
    SELECT custom_statuses INTO v_statuses
    FROM public.lists WHERE id = p_list_id;

    -- Se não tiver, tenta do folder
    IF v_statuses IS NULL AND v_folder_id IS NOT NULL THEN
        SELECT custom_statuses INTO v_statuses
        FROM public.folders WHERE id = v_folder_id;
    END IF;

    -- Se ainda não tiver, pega do space
    IF v_statuses IS NULL THEN
        SELECT custom_statuses INTO v_statuses
        FROM public.spaces WHERE id = v_space_id;
    END IF;

    -- Se ainda for NULL, retorna array vazio
    RETURN COALESCE(v_statuses, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- DADOS DE EXEMPLO (opcional - comentar em produção)
-- ====================================
-- Comentar esta seção antes de rodar em produção
/*
INSERT INTO public.workspaces (name, description, icon, color, owner)
VALUES (
    'Minha Empresa',
    'Workspace principal da empresa',
    '🏢',
    '#3B82F6',
    (SELECT id FROM public.app_users LIMIT 1)
);
*/
