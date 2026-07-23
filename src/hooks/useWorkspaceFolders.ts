import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeWorkError } from '@/features/work/api/workApi';
import { workQueryKeys } from '@/features/work/api/workQueryKeys';
import type {
  CreateWorkspaceFolderData,
  UpdateWorkspaceFolderData,
  WorkspaceFolder,
} from '@/types/hierarchy';

export const useWorkspaceFolders = (workspaceId?: string) => {
  const queryClient = useQueryClient();

  const invalidateTree = () => {
    if (workspaceId) {
      queryClient.invalidateQueries({ queryKey: workQueryKeys.tree(workspaceId) });
    }
  };

  const createWorkspaceFolder = async (data: CreateWorkspaceFolderData) => {
    try {
      const { data: folder, error } = await supabase
        .from('workspace_folders')
        .insert(data)
        .select('*')
        .single();

      if (error) throw normalizeWorkError(error);
      
      invalidateTree();
      return { data: folder as WorkspaceFolder, error: null };
    } catch (error) {
      console.error('Error creating workspace folder:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const updateWorkspaceFolder = async (id: string, data: UpdateWorkspaceFolderData) => {
    try {
      const { data: folder, error } = await supabase
        .from('workspace_folders')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw normalizeWorkError(error);

      invalidateTree();
      return { data: folder as WorkspaceFolder, error: null };
    } catch (error) {
      console.error('Error updating workspace folder:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const deleteWorkspaceFolder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workspace_folders')
        .delete()
        .eq('id', id);

      if (error) throw normalizeWorkError(error);

      invalidateTree();
      return { error: null };
    } catch (error) {
      console.error('Error deleting workspace folder:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  return {
    createWorkspaceFolder,
    updateWorkspaceFolder,
    deleteWorkspaceFolder,
  };
};

export default useWorkspaceFolders;
