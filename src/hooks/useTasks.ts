import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Task = Tables<'tasks'> & {
  app_users?: Tables<'app_users'> | null;
  projects?: Tables<'projects'> | null;
};

export type CreateTaskData = {
  project_id: string;
  title: string;
  description?: string | null;
  status?: string;
  due_date?: string | null;
  owner: string;
};

export type UpdateTaskData = Partial<{
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
}>;

export const useTasks = (projectId?: string) => {
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch tasks, optionally filtered by projectId
  const { data: tasks, error, refetch } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('tasks')
          .select(`
            *,
            app_users (
              id,
              name,
              email
            ),
            projects (
              id,
              title,
              status
            )
          `)
          .order('due_date', { ascending: true });
        
        // Filter by project_id if provided
        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Task[];
      } finally {
        setLoading(false);
      }
    },
    enabled: true, // Always fetch tasks, even if projectId is undefined
  });

  // Create a new task
  const createTask = async (taskData: CreateTaskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select();

      if (error) throw error;
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating task:', error);
      return { data: null, error };
    }
  };

  // Update an existing task
  const updateTask = async (taskId: string, updateData: UpdateTaskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select();

      if (error) throw error;
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating task:', error);
      return { data: null, error };
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting task:', error);
      return { error };
    }
  };

  // Get a single task by ID
  const getTaskById = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          app_users (
            id,
            name,
            email
          ),
          projects (
            id,
            title,
            status
          )
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      
      return { data: data as Task, error: null };
    } catch (error: any) {
      console.error('Error fetching task:', error);
      return { data: null, error };
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: string) => {
    return updateTask(taskId, { status });
  };

  return {
    tasks,
    loading,
    error,
    refetch,
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    updateTaskStatus
  };
};

export default useTasks;
