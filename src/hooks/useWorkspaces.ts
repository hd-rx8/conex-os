import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  Workspace,
  CreateWorkspaceData,
  UpdateWorkspaceData,
  WorkspaceMember,
  CreateWorkspaceMemberData,
  UpdateWorkspaceMemberData,
  WorkspaceTree,
} from '@/types/hierarchy';

export const useWorkspaces = (userId?: string) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch workspaces onde o usuário é membro
  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setWorkspaces(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Create workspace
  const createWorkspace = async (data: CreateWorkspaceData) => {
    try {
      // 1. Criar workspace
      const { data: workspace, error: createError } = await supabase
        .from('workspaces')
        .insert(data)
        .select()
        .single();

      if (createError) {
        console.error('Error creating workspace:', createError);
        throw createError;
      }

      if (!workspace) {
        throw new Error('Workspace created but no data returned');
      }

      // 2. Adicionar o criador como owner na tabela workspace_members
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: data.owner,
          role: 'owner',
        });

      if (memberError) {
        console.error('Error adding workspace member:', memberError);
        // Tentar deletar o workspace criado se falhar ao adicionar membro
        await supabase.from('workspaces').delete().eq('id', workspace.id);
        throw new Error(`Failed to add member: ${memberError.message}`);
      }

      // 3. Recarregar workspaces
      await fetchWorkspaces();
      return { data: workspace, error: null };
    } catch (err) {
      console.error('Error in createWorkspace:', err);
      return { data: null, error: err as Error };
    }
  };

  // Update workspace
  const updateWorkspace = async (id: string, data: UpdateWorkspaceData) => {
    try {
      const { data: workspace, error: updateError } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchWorkspaces();
      return { data: workspace, error: null };
    } catch (err) {
      console.error('Error updating workspace:', err);
      return { data: null, error: err as Error };
    }
  };

  // Delete workspace
  const deleteWorkspace = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchWorkspaces();
      return { error: null };
    } catch (err) {
      console.error('Error deleting workspace:', err);
      return { error: err as Error };
    }
  };

  // Get workspace tree (com spaces, folders, lists)
  const getWorkspaceTree = async (workspaceId: string): Promise<WorkspaceTree | null> => {
    try {
      // Fetch workspace
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (wsError) throw wsError;

      // Fetch spaces
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('position');

      if (spacesError) throw spacesError;

      // Fetch folders
      const spaceIds = spaces?.map((s) => s.id) || [];
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .in('space_id', spaceIds)
        .order('position');

      if (foldersError) throw foldersError;

      // Fetch lists
      const { data: lists, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .in('space_id', spaceIds)
        .order('position');

      if (listsError) throw listsError;

      // Fetch members
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('*, app_users(id, name, email)')
        .eq('workspace_id', workspaceId);

      if (membersError) throw membersError;

      // Construir árvore
      const tree: WorkspaceTree = {
        ...workspace,
        members: members || [],
        spaces: (spaces || []).map((space) => ({
          ...space,
          folders: (folders || [])
            .filter((f) => f.space_id === space.id)
            .map((folder) => ({
              ...folder,
              lists: (lists || []).filter((l) => l.folder_id === folder.id),
            })),
          lists: (lists || []).filter((l) => l.space_id === space.id && !l.folder_id),
        })),
      };

      return tree;
    } catch (err) {
      console.error('Error fetching workspace tree:', err);
      return null;
    }
  };

  return {
    workspaces,
    loading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceTree,
  };
};

// Hook para gerenciar membros do workspace
export const useWorkspaceMembers = (workspaceId: string) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*, app_users(id, name, email)')
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId, fetchMembers]);

  const addMember = async (data: CreateWorkspaceMemberData) => {
    try {
      const { data: member, error } = await supabase
        .from('workspace_members')
        .insert(data)
        .select('*, app_users(id, name, email)')
        .single();

      if (error) throw error;
      await fetchMembers();
      return { data: member, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateMember = async (id: string, data: UpdateWorkspaceMemberData) => {
    try {
      const { data: member, error } = await supabase
        .from('workspace_members')
        .update(data)
        .eq('id', id)
        .select('*, app_users(id, name, email)')
        .single();

      if (error) throw error;
      await fetchMembers();
      return { data: member, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const removeMember = async (id: string) => {
    try {
      const { error } = await supabase.from('workspace_members').delete().eq('id', id);

      if (error) throw error;
      await fetchMembers();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return {
    members,
    loading,
    fetchMembers,
    addMember,
    updateMember,
    removeMember,
  };
};
