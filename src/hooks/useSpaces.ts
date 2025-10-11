import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Space, CreateSpaceData, UpdateSpaceData, Folder, CreateFolderData, UpdateFolderData, List, CreateListData, UpdateListData } from '@/types/hierarchy';

// Hook para Spaces
export const useSpaces = (workspaceId?: string) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('spaces').select('*, workspaces(*)').order('position');

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setSpaces(data || []);
    } catch (err) {
      console.error('Error fetching spaces:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const createSpace = async (data: CreateSpaceData) => {
    try {
      const { data: space, error } = await supabase
        .from('spaces')
        .insert(data)
        .select('*, workspaces(*)')
        .single();

      if (error) throw error;
      await fetchSpaces();
      return { data: space, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateSpace = async (id: string, data: UpdateSpaceData) => {
    try {
      const { data: space, error } = await supabase
        .from('spaces')
        .update(data)
        .eq('id', id)
        .select('*, workspaces(*)')
        .single();

      if (error) throw error;
      await fetchSpaces();
      return { data: space, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteSpace = async (id: string) => {
    try {
      const { error } = await supabase.from('spaces').delete().eq('id', id);
      if (error) throw error;
      await fetchSpaces();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return {
    spaces,
    loading,
    fetchSpaces,
    createSpace,
    updateSpace,
    deleteSpace,
  };
};

// Hook para Folders
export const useFolders = (spaceId?: string) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('folders').select('*, spaces(*)').order('position');

      if (spaceId) {
        query = query.eq('space_id', spaceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setFolders(data || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (data: CreateFolderData) => {
    try {
      const { data: folder, error } = await supabase
        .from('folders')
        .insert(data)
        .select('*, spaces(*)')
        .single();

      if (error) throw error;
      await fetchFolders();
      return { data: folder, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateFolder = async (id: string, data: UpdateFolderData) => {
    try {
      const { data: folder, error } = await supabase
        .from('folders')
        .update(data)
        .eq('id', id)
        .select('*, spaces(*)')
        .single();

      if (error) throw error;
      await fetchFolders();
      return { data: folder, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      const { error } = await supabase.from('folders').delete().eq('id', id);
      if (error) throw error;
      await fetchFolders();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return {
    folders,
    loading,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
};

// Hook para Lists
export const useLists = (spaceId?: string, folderId?: string | null) => {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('lists').select('*, spaces(*), folders(*)').order('position');

      if (spaceId) {
        query = query.eq('space_id', spaceId);
      }

      if (folderId !== undefined) {
        if (folderId === null) {
          query = query.is('folder_id', null);
        } else {
          query = query.eq('folder_id', folderId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setLists(data || []);
    } catch (err) {
      console.error('Error fetching lists:', err);
    } finally {
      setLoading(false);
    }
  }, [spaceId, folderId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = async (data: CreateListData) => {
    try {
      const { data: list, error } = await supabase
        .from('lists')
        .insert(data)
        .select('*, spaces(*), folders(*)')
        .single();

      if (error) throw error;
      await fetchLists();
      return { data: list, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateList = async (id: string, data: UpdateListData) => {
    try {
      const { data: list, error } = await supabase
        .from('lists')
        .update(data)
        .eq('id', id)
        .select('*, spaces(*), folders(*)')
        .single();

      if (error) throw error;
      await fetchLists();
      return { data: list, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteList = async (id: string) => {
    try {
      const { error } = await supabase.from('lists').delete().eq('id', id);
      if (error) throw error;
      await fetchLists();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const moveList = async (listId: string, newFolderId: string | null, newSpaceId?: string) => {
    try {
      const updateData: UpdateListData = {
        folder_id: newFolderId,
      };

      if (newSpaceId) {
        updateData.space_id = newSpaceId;
      }

      return await updateList(listId, updateData);
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  return {
    lists,
    loading,
    fetchLists,
    createList,
    updateList,
    deleteList,
    moveList,
  };
};
