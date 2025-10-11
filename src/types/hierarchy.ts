// ====================================
// TIPOS DA HIERARQUIA ORGANIZACIONAL
// ====================================

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type TaskStatus = 'Pendente' | 'Em Progresso' | 'Concluída';

// ====================================
// Custom Status Type
// ====================================
export interface CustomStatus {
  name: string;
  color: string;
}

// ====================================
// 1. WORKSPACE
// ====================================
export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  owner: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}

// ====================================
// WORKSPACE MEMBERS
// ====================================
export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  // Relations
  app_users?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateWorkspaceMemberData {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
}

export interface UpdateWorkspaceMemberData {
  role?: WorkspaceRole;
}

// ====================================
// 2. SPACE
// ====================================
export interface Space {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  custom_statuses: CustomStatus[];
  position: number;
  created_at: string;
  updated_at: string;
  // Relations
  workspaces?: Workspace;
}

export interface CreateSpaceData {
  workspace_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  custom_statuses?: CustomStatus[];
  position?: number;
}

export interface UpdateSpaceData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  custom_statuses?: CustomStatus[];
  position?: number;
}

// ====================================
// 3. FOLDER
// ====================================
export interface Folder {
  id: string;
  space_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  custom_statuses: CustomStatus[] | null; // null = herda do space
  position: number;
  created_at: string;
  updated_at: string;
  // Relations
  spaces?: Space;
}

export interface CreateFolderData {
  space_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  custom_statuses?: CustomStatus[];
  position?: number;
}

export interface UpdateFolderData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  custom_statuses?: CustomStatus[] | null;
  position?: number;
}

// ====================================
// 4. LIST
// ====================================
export interface List {
  id: string;
  space_id: string;
  folder_id: string | null; // OPCIONAL
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  custom_statuses: CustomStatus[] | null; // null = herda do folder ou space
  position: number;
  created_at: string;
  updated_at: string;
  // Relations
  spaces?: Space;
  folders?: Folder;
}

export interface CreateListData {
  space_id: string;
  folder_id?: string | null;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  custom_statuses?: CustomStatus[];
  position?: number;
}

export interface UpdateListData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  custom_statuses?: CustomStatus[] | null;
  position?: number;
  folder_id?: string | null;
}

// ====================================
// 5. TASK
// ====================================
export interface HierarchyTask {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  status: string; // pode ser customizado
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  creator_id: string;
  tags: string[] | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // Relations
  lists?: List;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateTaskData {
  list_id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: string | null;
  creator_id: string;
  tags?: string[];
  estimated_hours?: number;
  position?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: string | null;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  position?: number;
}

// ====================================
// 6. SUBTASK
// ====================================
export interface Subtask {
  id: string;
  task_id: string;
  parent_subtask_id: string | null; // permite aninhamento infinito
  title: string;
  description: string | null;
  status: string;
  assignee_id: string | null;
  creator_id: string;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // Relations
  hierarchy_tasks?: HierarchyTask;
  parent_subtask?: Subtask;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  // Para renderização em árvore
  children?: Subtask[];
}

export interface CreateSubtaskData {
  task_id: string;
  parent_subtask_id?: string | null;
  title: string;
  description?: string;
  status?: string;
  assignee_id?: string | null;
  creator_id: string;
  due_date?: string | null;
  position?: number;
}

export interface UpdateSubtaskData {
  title?: string;
  description?: string;
  status?: string;
  assignee_id?: string | null;
  due_date?: string | null;
  position?: number;
}

// ====================================
// HIERARQUIA COMPLETA
// ====================================
export interface TaskHierarchyView {
  task_id: string;
  task_title: string;
  list_id: string;
  list_name: string;
  folder_id: string | null;
  folder_name: string | null;
  space_id: string;
  space_name: string;
  workspace_id: string;
  workspace_name: string;
}

export interface ListTaskCount {
  list_id: string;
  list_name: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
}

// ====================================
// ESTRUTURA EM ÁRVORE PARA NAVEGAÇÃO
// ====================================
export interface WorkspaceTree extends Workspace {
  spaces: SpaceTree[];
  members?: WorkspaceMember[];
}

export interface SpaceTree extends Space {
  folders: FolderTree[];
  lists: ListTree[]; // lists diretas (sem folder)
}

export interface FolderTree extends Folder {
  lists: ListTree[];
}

export interface ListTree extends List {
  tasks?: HierarchyTask[];
  taskCount?: number;
}

export interface TaskTree extends HierarchyTask {
  subtasks: SubtaskTree[];
}

export interface SubtaskTree extends Subtask {
  children: SubtaskTree[]; // aninhamento infinito
}

// ====================================
// BREADCRUMB PARA NAVEGAÇÃO
// ====================================
export interface HierarchyBreadcrumb {
  type: 'workspace' | 'space' | 'folder' | 'list' | 'task';
  id: string;
  name: string;
}

// ====================================
// FILTROS E BUSCAS
// ====================================
export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  tags?: string[];
  list_id?: string;
  space_id?: string;
  workspace_id?: string;
}

// ====================================
// PERMISSÕES
// ====================================
export interface HierarchyPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
}

export const getPermissionsByRole = (role: WorkspaceRole): HierarchyPermissions => {
  switch (role) {
    case 'owner':
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canManageMembers: true,
      };
    case 'admin':
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canManageMembers: true,
      };
    case 'member':
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canManageMembers: false,
      };
    case 'viewer':
      return {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
      };
  }
};
