import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type Project = Tables<'projects'> & {
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

export const useProjects = () => {
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch all projects for the current user
  const { data: projects, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            app_users (
              id,
              name,
              email
            )
          `)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        return data as Project[];
      } finally {
        setLoading(false);
      }
    },
  });

  // Create a new project
  const createProject = useCallback(async (projectData: CreateProjectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select();

      if (error) throw error;
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating project:', error);
      return { data: null, error };
    }
  }, [queryClient]);

  // Update an existing project
  const updateProject = useCallback(async (projectId: string, updateData: UpdateProjectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select();

      if (error) throw error;
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating project:', error);
      return { data: null, error };
    }
  }, [queryClient]);

  // Delete a project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting project:', error);
      return { error };
    }
  }, [queryClient]);

  // Get a single project by ID - using useCallback to prevent infinite loops
  const getProjectById = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          app_users (
            id,
            name,
            email
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      
      return { data: data as Project, error: null };
    } catch (error: any) {
      console.error('Error fetching project:', error);
      return { data: null, error };
    }
  }, []);

  return {
    projects,
    loading,
    error,
    refetch,
    createProject,
    updateProject,
    deleteProject,
    getProjectById
  };
};

export default useProjects;