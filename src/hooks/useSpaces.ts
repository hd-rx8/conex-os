import { useQuery, useQueryClient } from '@tanstack/react-query';

import { normalizeWorkError } from '@/features/work/api/workApi';
import {
  useCreateSpaceMutation,
  useDeleteSpaceMutation,
  useUpdateSpaceMutation,
  useWorkspaceTreeQuery,
} from '@/features/work/hooks/useWorkData';
import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables } from '@/integrations/supabase/types';
import type {
  CreateFolderData,
  CreateListData,
  CreateSpaceData,
  CustomStatus,
  Folder,
  List,
  UpdateFolderData,
  UpdateListData,
  UpdateSpaceData,
} from '@/types/hierarchy';

const WORK_STALE_TIME = 30_000;

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error !== null && 'userMessage' in error) {
    return new Error(String(error.userMessage));
  }
  return new Error('Não foi possível concluir a operação no Work Management.');
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapCustomStatuses(value: Json | null): CustomStatus[] | null {
  if (value === null || !Array.isArray(value)) return null;
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    return typeof item.name === 'string' && typeof item.color === 'string'
      ? [{ name: item.name, color: item.color }]
      : [];
  });
}

function mapFolder(row: Tables<'folders'>): Folder {
  return { ...row, custom_statuses: mapCustomStatuses(row.custom_statuses) };
}

function mapList(row: Tables<'lists'>): List {
  return { ...row, custom_statuses: mapCustomStatuses(row.custom_statuses) };
}

export const useSpaces = (workspaceId?: string) => {
  const query = useWorkspaceTreeQuery(workspaceId);
  const createMutation = useCreateSpaceMutation();
  const updateMutation = useUpdateSpaceMutation(workspaceId);
  const deleteMutation = useDeleteSpaceMutation(workspaceId);

  const createSpace = async (data: CreateSpaceData) => {
    try {
      return { data: await createMutation.mutateAsync(data), error: null };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  };

  const updateSpace = async (id: string, data: UpdateSpaceData) => {
    try {
      return {
        data: await updateMutation.mutateAsync({ id, data }),
        error: null,
      };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  };

  const deleteSpace = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error: toError(error) };
    }
  };

  return {
    spaces: query.data?.spaces ?? [],
    loading: query.isLoading,
    error: query.error ? toError(query.error) : null,
    fetchSpaces: query.refetch,
    createSpace,
    updateSpace,
    deleteSpace,
  };
};
export const useFolders = (spaceId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['work', 'folders', spaceId ?? 'none'] as const;
  const query = useQuery({
    queryKey,
    enabled: Boolean(spaceId),
    staleTime: WORK_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('space_id', spaceId as string)
        .order('position');

      if (error) throw normalizeWorkError(error);
      return (data ?? []).map(mapFolder);
    },
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey, exact: true }),
      queryClient.invalidateQueries({ queryKey: ['work', 'tree'] }),
    ]);
  };

  const createFolder = async (data: CreateFolderData) => {
    const { data: folder, error } = await supabase
      .from('folders')
      .insert(data)
      .select('*')
      .single();

    if (error) return { data: null, error: toError(normalizeWorkError(error)) };
    await invalidate();
    return { data: mapFolder(folder), error: null };
  };

  const updateFolder = async (id: string, data: UpdateFolderData) => {
    const { data: folder, error } = await supabase
      .from('folders')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return { data: null, error: toError(normalizeWorkError(error)) };
    await invalidate();
    return { data: mapFolder(folder), error: null };
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (error) return { error: toError(normalizeWorkError(error)) };
    await invalidate();
    return { error: null };
  };

  return {
    folders: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? toError(query.error) : null,
    fetchFolders: query.refetch,
    createFolder,
    updateFolder,
    deleteFolder,
  };
};

export const useLists = (spaceId?: string, folderId?: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = ['work', 'lists', spaceId ?? 'none', folderId ?? null] as const;
  const query = useQuery({
    queryKey,
    enabled: Boolean(spaceId),
    staleTime: WORK_STALE_TIME,
    queryFn: async () => {
      let request = supabase
        .from('lists')
        .select('*')
        .eq('space_id', spaceId as string)
        .order('position');

      if (folderId === null) request = request.is('folder_id', null);
      if (folderId) request = request.eq('folder_id', folderId);

      const { data, error } = await request;
      if (error) throw normalizeWorkError(error);
      return (data ?? []).map(mapList);
    },
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['work', 'lists'] }),
      queryClient.invalidateQueries({ queryKey: ['work', 'tree'] }),
    ]);
  };

  const createList = async (data: CreateListData) => {
    let finalData = { ...data };
    if (!finalData.workspace_id && finalData.space_id) {
      const { data: space } = await supabase
        .from('spaces')
        .select('workspace_id, workspace_folder_id')
        .eq('id', finalData.space_id)
        .single();
        
      if (space) {
        finalData.workspace_id = space.workspace_id;
        finalData.workspace_folder_id = space.workspace_folder_id;
      }
    }

    const { data: list, error } = await supabase
      .from('lists')
      .insert(finalData)
      .select('*')
      .single();

    if (error) return { data: null, error: toError(normalizeWorkError(error)) };
    await invalidate();
    return { data: mapList(list), error: null };
  };

  const updateList = async (id: string, data: UpdateListData) => {
    const { data: list, error } = await supabase
      .from('lists')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return { data: null, error: toError(normalizeWorkError(error)) };
    await invalidate();
    return { data: mapList(list), error: null };
  };

  const deleteList = async (id: string) => {
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) return { error: toError(normalizeWorkError(error)) };
    await invalidate();
    return { error: null };
  };

  const moveList = (
    listId: string,
    newFolderId: string | null,
    newSpaceId?: string,
  ) =>
    updateList(listId, {
      folder_id: newFolderId,
      ...(newSpaceId ? { space_id: newSpaceId } : {}),
    });

  return {
    lists: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? toError(query.error) : null,
    fetchLists: query.refetch,
    refetch: query.refetch,
    createList,
    updateList,
    deleteList,
    moveList,
  };
};
