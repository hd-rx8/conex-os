import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useCallback } from 'react';

export type List = Tables<'lists'>;

export type CreateListData = {
  space_id?: string | null;
  folder_id?: string | null;
  name: string;
  description?: string | null;
  workspace_id?: string;
  workspace_folder_id?: string | null;
};

type CanonicalListPath = Pick<
  Tables<'spaces'>,
  'workspace_id' | 'workspace_folder_id'
>;

export function buildCanonicalListInsert(
  listData: CreateListData,
  path?: CanonicalListPath,
) {
  const workspaceId = listData.workspace_id ?? path?.workspace_id;

  if (!workspaceId) {
    throw new Error('Informe um workspace ou um projeto para criar a lista.');
  }

  return {
    ...listData,
    workspace_id: workspaceId,
    workspace_folder_id:
      listData.workspace_folder_id ?? path?.workspace_folder_id ?? null,
  };
}

export type UpdateListData = Partial<{
  name: string;
  description: string | null;
  position: number;
}>;

export const useLists = (spaceId?: string, folderId?: string) => {
  const queryClient = useQueryClient();

  // Fetch lists filtered by spaceId and/or folderId
  const { data: lists, error, refetch, isLoading } = useQuery({
    queryKey: ['lists', spaceId, folderId],
    queryFn: async () => {
      let query = supabase
        .from('lists')
        .select('*')
        .order('position', { ascending: true });

      // Filter by space_id if provided
      if (spaceId) {
        query = query.eq('space_id', spaceId);
      }

      // Filter by folder_id if provided
      if (folderId !== undefined) {
        if (folderId === null) {
          query = query.is('folder_id', null);
        } else {
          query = query.eq('folder_id', folderId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as List[];
    },
    enabled: true,
  });

  // Create a new list
  const createList = useCallback(async (listData: CreateListData) => {
    try {
      let path: CanonicalListPath | undefined;

      if (!listData.workspace_id) {
        if (!listData.space_id) {
          throw new Error('Informe um workspace ou um projeto para criar a lista.');
        }

        const { data: space, error: spaceError } = await supabase
          .from('spaces')
          .select('workspace_id, workspace_folder_id')
          .eq('id', listData.space_id)
          .single();

        if (spaceError) throw spaceError;
        path = space;
      }

      const { data, error } = await supabase
        .from('lists')
        .insert(buildCanonicalListInsert(listData, path))
        .select();

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['lists'] });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating list:', error);
      return { data: null, error };
    }
  }, [queryClient]);

  // Update an existing list
  const updateList = useCallback(async (listId: string, updateData: UpdateListData) => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .update(updateData)
        .eq('id', listId)
        .select();

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['lists'] });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating list:', error);
      return { data: null, error };
    }
  }, [queryClient]);

  // Delete a list
  const deleteList = useCallback(async (listId: string) => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['lists'] });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting list:', error);
      return { error };
    }
  }, [queryClient]);

  // Get a single list by ID
  const getListById = useCallback(async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (error) throw error;

      return { data: data as List, error: null };
    } catch (error: any) {
      console.error('Error fetching list:', error);
      return { data: null, error };
    }
  }, []);

  return {
    lists,
    loading: isLoading,
    error,
    refetch,
    createList,
    updateList,
    deleteList,
    getListById,
  };
};

export default useLists;
