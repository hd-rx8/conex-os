import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Define Subtask type manually since it might not be in generated types yet
export type Subtask = {
  id: string;
  task_id: string;
  parent_subtask_id: string | null;
  title: string;
  description: string | null;
  status: string;
  assignee_id: string | null;
  creator_id: string;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type CreateSubtaskData = {
  task_id: string;
  parent_subtask_id?: string | null;
  title: string;
  description?: string | null;
  status?: string;
  assignee_id?: string | null;
  creator_id: string;
  due_date?: string | null;
  position?: number;
};

export type UpdateSubtaskData = Partial<{
  title: string;
  description: string | null;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
  position: number;
  completed_at: string | null;
}>;

export const useSubtasks = (taskId?: string) => {
  const queryClient = useQueryClient();

  // Fetch subtasks for a specific task
  const { data: subtasks, error, refetch, isLoading } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      console.log('[useSubtasks] Fetching subtasks for task:', taskId);

      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .is('parent_subtask_id', null) // Only root-level subtasks
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useSubtasks] Error fetching subtasks:', error);
        throw error;
      }

      console.log('[useSubtasks] Subtasks fetched:', data?.length || 0);
      return data as Subtask[];
    },
    enabled: !!taskId,
    staleTime: 0,
  });

  // Create a new subtask
  const createSubtask = async (subtaskData: CreateSubtaskData) => {
    try {
      console.log('[useSubtasks] Creating subtask:', subtaskData);

      const { data, error } = await supabase
        .from('subtasks')
        .insert(subtaskData)
        .select()
        .single();

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['subtasks', subtaskData.task_id] });

      console.log('[useSubtasks] Subtask created successfully:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('[useSubtasks] Error creating subtask:', error);
      return { data: null, error };
    }
  };

  // Update a subtask
  const updateSubtask = async (subtaskId: string, updateData: UpdateSubtaskData) => {
    try {
      console.log('[useSubtasks] Updating subtask:', subtaskId, updateData);

      const { data, error } = await supabase
        .from('subtasks')
        .update(updateData)
        .eq('id', subtaskId)
        .select()
        .single();

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });

      console.log('[useSubtasks] Subtask updated successfully:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('[useSubtasks] Error updating subtask:', error);
      return { data: null, error };
    }
  };

  // Delete a subtask
  const deleteSubtask = async (subtaskId: string) => {
    try {
      console.log('[useSubtasks] Deleting subtask:', subtaskId);

      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });

      console.log('[useSubtasks] Subtask deleted successfully');
      return { error: null };
    } catch (error: any) {
      console.error('[useSubtasks] Error deleting subtask:', error);
      return { error };
    }
  };

  // Toggle subtask completion
  const toggleSubtaskComplete = async (subtask: Subtask) => {
    const isCompleted = subtask.status === 'Concluída';
    const newStatus = isCompleted ? 'Pendente' : 'Concluída';
    const completedAt = isCompleted ? null : new Date().toISOString();

    return updateSubtask(subtask.id, {
      status: newStatus,
      completed_at: completedAt,
    });
  };

  // Reorder subtasks (batch update positions)
  const reorderSubtasks = async (reorderedSubtasks: Subtask[]) => {
    try {
      console.log('[useSubtasks] Reordering subtasks:', reorderedSubtasks.map(s => s.id));

      // Update positions for all subtasks
      const updates = reorderedSubtasks.map((subtask, index) =>
        supabase
          .from('subtasks')
          .update({ position: index })
          .eq('id', subtask.id)
      );

      const results = await Promise.all(updates);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });

      console.log('[useSubtasks] Subtasks reordered successfully');
      return { error: null };
    } catch (error: any) {
      console.error('[useSubtasks] Error reordering subtasks:', error);
      return { error };
    }
  };

  return {
    subtasks,
    loading: isLoading,
    error,
    refetch,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtaskComplete,
    reorderSubtasks,
  };
};

export default useSubtasks;
