import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  HierarchyTask,
  CreateTaskData,
  UpdateTaskData,
  Subtask,
  CreateSubtaskData,
  UpdateSubtaskData,
  TaskFilters,
} from '@/types/hierarchy';

// Hook para gerenciar tasks
export const useHierarchyTasks = (listId?: string, filters?: TaskFilters) => {
  const [tasks, setTasks] = useState<HierarchyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('tasks')
        .select(`
          *,
          lists(id, name, space_id, folder_id),
          assignee:app_users!tasks_assignee_id_fkey(id, name, email),
          creator:app_users!tasks_creator_id_fkey(id, name, email)
        `)
        .order('position');

      // Filtros
      if (listId) {
        query = query.eq('list_id', listId);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.assignee_id) {
        query = query.eq('assignee_id', filters.assignee_id);
      }

      if (filters?.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }

      if (filters?.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTasks(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [listId, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: CreateTaskData) => {
    try {
      const { data: task, error: createError } = await supabase
        .from('tasks')
        .insert(data)
        .select(`
          *,
          lists(id, name, space_id, folder_id),
          assignee:app_users!tasks_assignee_id_fkey(id, name, email),
          creator:app_users!tasks_creator_id_fkey(id, name, email)
        `)
        .single();

      if (createError) throw createError;

      await fetchTasks();
      return { data: task, error: null };
    } catch (err) {
      console.error('Error creating task:', err);
      return { data: null, error: err as Error };
    }
  };

  const updateTask = async (id: string, data: UpdateTaskData) => {
    try {
      const { data: task, error: updateError } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          lists(id, name, space_id, folder_id),
          assignee:app_users!tasks_assignee_id_fkey(id, name, email),
          creator:app_users!tasks_creator_id_fkey(id, name, email)
        `)
        .single();

      if (updateError) throw updateError;

      await fetchTasks();
      return { data: task, error: null };
    } catch (err) {
      console.error('Error updating task:', err);
      return { data: null, error: err as Error };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchTasks();
      return { error: null };
    } catch (err) {
      console.error('Error deleting task:', err);
      return { error: err as Error };
    }
  };

  const reorderTasks = async (taskId: string, newPosition: number) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ position: newPosition })
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
      return { error: null };
    } catch (err) {
      console.error('Error reordering task:', err);
      return { error: err as Error };
    }
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
};

// Hook para gerenciar subtasks
export const useSubtasks = (taskId?: string) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubtasks = useCallback(async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subtasks')
        .select(`
          *,
          tasks(id, title),
          parent_subtask:subtasks!parent_subtask_id(id, title),
          assignee:app_users!subtasks_assignee_id_fkey(id, name, email),
          creator:app_users!subtasks_creator_id_fkey(id, name, email)
        `)
        .eq('task_id', taskId)
        .order('position');

      if (error) throw error;

      setSubtasks(data || []);
    } catch (err) {
      console.error('Error fetching subtasks:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  const createSubtask = async (data: CreateSubtaskData) => {
    try {
      const { data: subtask, error } = await supabase
        .from('subtasks')
        .insert(data)
        .select(`
          *,
          tasks(id, title),
          parent_subtask:subtasks!parent_subtask_id(id, title),
          assignee:app_users!subtasks_assignee_id_fkey(id, name, email),
          creator:app_users!subtasks_creator_id_fkey(id, name, email)
        `)
        .single();

      if (error) throw error;

      await fetchSubtasks();
      return { data: subtask, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateSubtask = async (id: string, data: UpdateSubtaskData) => {
    try {
      const { data: subtask, error } = await supabase
        .from('subtasks')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          tasks(id, title),
          parent_subtask:subtasks!parent_subtask_id(id, title),
          assignee:app_users!subtasks_assignee_id_fkey(id, name, email),
          creator:app_users!subtasks_creator_id_fkey(id, name, email)
        `)
        .single();

      if (error) throw error;

      await fetchSubtasks();
      return { data: subtask, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteSubtask = async (id: string) => {
    try {
      const { error } = await supabase.from('subtasks').delete().eq('id', id);

      if (error) throw error;

      await fetchSubtasks();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Função para construir árvore de subtasks (aninhamento infinito)
  const buildSubtaskTree = (subtasks: Subtask[]): Subtask[] => {
    const subtaskMap = new Map<string, Subtask>();
    const roots: Subtask[] = [];

    // Criar mapa de subtasks
    subtasks.forEach((subtask) => {
      subtaskMap.set(subtask.id, { ...subtask, children: [] });
    });

    // Construir árvore
    subtasks.forEach((subtask) => {
      const node = subtaskMap.get(subtask.id)!;

      if (subtask.parent_subtask_id) {
        const parent = subtaskMap.get(subtask.parent_subtask_id);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  return {
    subtasks,
    subtaskTree: buildSubtaskTree(subtasks),
    loading,
    fetchSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    buildSubtaskTree,
  };
};

// Hook para obter status herdados
export const useInheritedStatuses = (listId?: string) => {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!listId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_inherited_statuses', {
          p_list_id: listId,
        });

        if (error) throw error;

        setStatuses(data || []);
      } catch (err) {
        console.error('Error fetching inherited statuses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, [listId]);

  return { statuses, loading };
};
