import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// DEPRECATED: Esta interface é mantida apenas para compatibilidade com código legado
// Use useSpaces para novos desenvolvimentos
export type Project = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  owner: string;
  created_at: string;
  updated_at: string;
  app_users?: Tables<'app_users'> | null;
};

export type CreateProjectData = {
  title: string;
  description?: string | null;
  status?: string;
  owner: string;
};

export type UpdateProjectData = Partial<{
  title: string;
  description: string | null;
  status: string;
}>;

// DEPRECATED: Use useSpaces() para novos desenvolvimentos
// Este hook mapeia spaces para a estrutura antiga de projects para compatibilidade
export const useProjects = () => {
  const queryClient = useQueryClient();

  // Fetch spaces as projects for backward compatibility
  const { data: projects, error, refetch, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          *,
          workspaces!inner(id, name, owner)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Map spaces to old project structure
      return (data || []).map(space => ({
        id: space.id,
        title: space.name,
        description: space.description || null,
        status: 'Ativo', // Spaces não têm status, assumimos Ativo
        owner: space.workspaces?.owner || '',
        created_at: space.created_at,
        updated_at: space.updated_at,
        app_users: null,
      })) as Project[];
    },
  });

  // Create a new project (now creates a space)
  const createProject = useCallback(async (projectData: CreateProjectData) => {
    try {
      // Get first workspace for the owner
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner', projectData.owner)
        .limit(1);

      if (wsError) throw wsError;

      if (!workspaces || workspaces.length === 0) {
        throw new Error('Nenhum workspace encontrado. Crie um workspace primeiro.');
      }

      const { data, error } = await supabase
        .from('spaces')
        .insert({
          workspace_id: workspaces[0].id,
          name: projectData.title,
          description: projectData.description,
          icon: '📁',
          color: '#3B82F6',
          position: 0,
        })
        .select();

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating project:', error);
      return { data: null, error };
    }
  }, [queryClient]);

  // Update an existing project (now updates a space)
  const updateProject = useCallback(async (projectId: string, updateData: UpdateProjectData) => {
    try {
      const mappedData: any = {};
      if (updateData.title) mappedData.name = updateData.title;
      if (updateData.description !== undefined) mappedData.description = updateData.description;
      // status is ignored as spaces don't have status

      const { data, error } = await supabase
        .from('spaces')
        .update(mappedData)
        .eq('id', projectId)
        .select();

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating project:', error);
      return { data: null, error };
    }
  }, [queryClient]);

  // Delete a project (now deletes a space)
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting project:', error);
      return { error };
    }
  }, [queryClient]);

  // Get a single project by ID (now gets a space)
  const getProjectById = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          *,
          workspaces!inner(id, name, owner)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;

      // Map to project structure
      const project: Project = {
        id: data.id,
        title: data.name,
        description: data.description || null,
        status: 'Ativo',
        owner: data.workspaces?.owner || '',
        created_at: data.created_at,
        updated_at: data.updated_at,
        app_users: null,
      };

      return { data: project, error: null };
    } catch (error: any) {
      console.error('Error fetching project:', error);
      return { data: null, error };
    }
  }, []);

  return {
    projects,
    loading: isLoading,
    error,
    refetch,
    createProject,
    updateProject,
    deleteProject,
    getProjectById
  };
};

export default useProjects;