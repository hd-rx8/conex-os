import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Task = Tables<'tasks'> & {
  lists?: {
    id: string;
    name: string;
    space_id: string;
    spaces?: {
      id: string;
      name: string;
      icon?: string;
      color?: string;
    } | null;
  } | null;
};

export type CreateTaskData = {
  list_id: string;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
  creator_id: string;
  assignee_id?: string | null;
};

export type UpdateTaskData = Partial<{
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
}>;

export const useTasks = (listId?: string, spaceId?: string, userId?: string) => {
  const queryClient = useQueryClient();

  // Fetch tasks, optionally filtered by listId, spaceId, or userId
  const { data: tasks, error, refetch, isLoading } = useQuery({
    queryKey: ['tasks', listId, spaceId, userId],
    queryFn: async () => {
      console.log('[useTasks] ============ START FETCH ============');
      console.log('[useTasks] Fetching tasks with filters:', { listId, spaceId, userId });
      const startTime = Date.now();

      let query = supabase
        .from('tasks')
        .select(`
          *,
          lists (
            id,
            name,
            space_id,
            spaces (
              id,
              name,
              icon,
              color
            )
          )
        `)
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false });

      // Filter by userId (assignee or creator) if provided
      if (userId) {
        query = query.or(`assignee_id.eq.${userId},creator_id.eq.${userId}`);
      }

      // Filter by list_id if provided
      if (listId) {
        query = query.eq('list_id', listId);
      }

      // Filter by space_id if provided (via lists)
      if (spaceId && !listId) {
        const { data: listsInSpace } = await supabase
          .from('lists')
          .select('id')
          .eq('space_id', spaceId);

        if (listsInSpace && listsInSpace.length > 0) {
          const listIds = listsInSpace.map(l => l.id);
          query = query.in('list_id', listIds);
        } else {
          // No lists in this space, return empty
          console.log('[useTasks] No lists found in space:', spaceId);
          return [];
        }
      }

      const { data, error } = await query;

      const elapsedTime = Date.now() - startTime;
      console.log(`[useTasks] Query completed in ${elapsedTime}ms`);

      if (error) {
        console.error('[useTasks] ❌ ERROR fetching tasks:', error);
        console.error('[useTasks] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.log('[useTasks] ============ END FETCH (ERROR) ============');
        throw error;
      }

      console.log('[useTasks] ✅ Tasks fetched successfully:', data?.length || 0, 'tasks');
      console.log('[useTasks] Tasks data:', data);
      console.log('[useTasks] ============ END FETCH (SUCCESS) ============');
      return data as Task[];
    },
    enabled: true,
    retry: 1,
    staleTime: 0,
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
          lists (
            id,
            name,
            space_id,
            spaces (
              id,
              name,
              icon,
              color
            )
          ),
          creator:app_users!tasks_creator_id_fkey (
            id,
            name,
            email
          ),
          assignee:app_users!tasks_assignee_id_fkey (
            id,
            name,
            email
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
    loading: isLoading,
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
