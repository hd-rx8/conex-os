import type { Json, Tables } from '@/integrations/supabase/types';
import type {
  CustomStatus,
  FolderTree,
  ListTree,
  Space,
  SpaceStatus,
  SpaceTree,
  WorkspaceTree,
} from '@/types/hierarchy';

type WorkspaceRow = Tables<'workspaces'>;
type SpaceRow = Tables<'spaces'>;
type FolderRow = Tables<'folders'>;
type ListRow = Tables<'lists'>;

export type WorkspaceTreeRow = WorkspaceRow & {
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
      .filter((list) => list.folder_id === row.id)
      .map(mapList),
  };
}

function mapSpace(row: WorkspaceTreeRow['spaces'][number]): SpaceTree {
  const { folders, lists, ...space } = row;

  return {
    ...mapSpaceRow(space),
    folders: folders.map((folder) => mapFolder(folder, lists)),
    lists: lists.filter((list) => list.folder_id === null).map(mapList),
  };
}

export function mapWorkspaceTreeRow(row: WorkspaceTreeRow): WorkspaceTree {
  const { spaces, ...workspace } = row;
  return {
    ...workspace,
    spaces: spaces.map(mapSpace),
  };
}
