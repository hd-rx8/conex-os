import type { Json, Tables } from '@/integrations/supabase/types';
import type {
  CustomStatus,
  FolderTree,
  ListTree,
  Space,
  SpaceStatus,
  SpaceTree,
  TaskPriority,
  WorkTaskItem,
  WorkspaceTree,
} from '@/types/hierarchy';

type WorkspaceRow = Tables<'workspaces'>;
type WorkspaceFolderRow = Tables<'workspace_folders'>;
type SpaceRow = Tables<'spaces'>;
type FolderRow = Tables<'folders'>;
type ListRow = Tables<'lists'>;
type AppUserSummary = Pick<Tables<'app_users'>, 'id' | 'name' | 'email'>;

export type WorkTaskQueryRow = Tables<'tasks'> & {
  assignee: AppUserSummary | null;
  creator: AppUserSummary | null;
  list: {
    id: string;
    name: string;
    color: string | null;
    space_id: string | null;
    workspace_id: string | null;
    workspace_folder_id: string | null;
    space: {
      id: string;
      name: string;
      color: string | null;
      workspace_id: string;
    } | null;
    workspace: {
      id: string;
      name: string;
      color: string | null;
      icon: string | null;
    } | null;
  };
};

export type WorkspaceTreeRow = WorkspaceRow & {
  workspace_folders?: Array<WorkspaceFolderRow & { lists: ListRow[] }>;
  spaces: Array<
    SpaceRow & {
      folders: FolderRow[];
      lists: ListRow[];
    }
  >;
};

const SPACE_STATUSES: readonly SpaceStatus[] = [
  'Ativo',
  'Concluído',
  'Arquivado',
];

const TASK_PRIORITIES: readonly TaskPriority[] = [
  'Baixa',
  'Média',
  'Alta',
  'Urgente',
];

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapCustomStatuses(value: Json | null): CustomStatus[] | null {
  if (value === null || !Array.isArray(value)) return null;

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const { name, color } = item;
    return typeof name === 'string' && typeof color === 'string'
      ? [{ name, color }]
      : [];
  });
}

function mapSpaceStatus(value: string): SpaceStatus {
  return SPACE_STATUSES.includes(value as SpaceStatus)
    ? (value as SpaceStatus)
    : 'Ativo';
}

function mapTaskPriority(value: string): TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : 'Média';
}

export function mapSpaceRow(row: SpaceRow): Space {
  return {
    ...row,
    status: mapSpaceStatus(row.status),
    custom_statuses: mapCustomStatuses(row.custom_statuses) ?? [],
  };
}

function mapList(row: ListRow): ListTree {
  return {
    ...row,
    custom_statuses: mapCustomStatuses(row.custom_statuses),
  };
}

function mapFolder(row: FolderRow, lists: ListRow[]): FolderTree {
  return {
    ...row,
    custom_statuses: mapCustomStatuses(row.custom_statuses),
    lists: lists
      .filter((list) => list.folder_id === row.id && !list.workspace_folder_id)
      .map(mapList),
  };
}

function mapSpace(row: WorkspaceTreeRow['spaces'][number]): SpaceTree {
  const { folders, lists, ...space } = row;

  return {
    ...mapSpaceRow(space),
    folders: folders.map((folder) => mapFolder(folder, lists)),
    lists: lists
      .filter((list) => list.folder_id === null)
      .map(mapList),
  };
}

export function mapWorkspaceTreeRow(row: WorkspaceTreeRow): WorkspaceTree {
  const { spaces, workspace_folders = [], ...workspace } = row;

  const allSpaces = spaces.map(mapSpace);

  // We are removing workspace_folders entirely from the UI representation.
  return {
    ...workspace,
    workspace_folders: [],
    spaces: allSpaces,
  };
}

export function mapWorkTaskRow(row: WorkTaskQueryRow): WorkTaskItem {
  const { list, assignee, creator, ...task } = row;
  const workspaceId = list.workspace_id ?? list.space?.workspace_id;

  if (!workspaceId) {
    throw new Error('A lista da tarefa não possui um workspace válido.');
  }

  return {
    ...task,
    priority: mapTaskPriority(task.priority),
    assignee: assignee ?? undefined,
    creator: creator ?? undefined,
    context: {
      workspace_id: workspaceId,
      workspace_name: list.workspace?.name ?? null,
      workspace_color: list.workspace?.color ?? null,
      workspace_icon: list.workspace?.icon ?? null,
      space_id: list.space?.id ?? list.space_id,
      space_name: list.space?.name ?? null,
      space_color: list.space?.color ?? null,
      list_id: list.id,
      list_name: list.name,
      list_color: list.color ?? null,
    },
  };
}
