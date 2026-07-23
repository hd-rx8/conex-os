import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type {
  HierarchyTask,
  CreateSpaceData,
  CreateTaskData,
  CreateWorkspaceData,
  Space,
  TaskFilters,
  TaskPriority,
  UpdateSpaceData,
  UpdateTaskData,
  UpdateWorkspaceData,
  Workspace,
  WorkspaceTree,
} from '@/types/hierarchy';

import {
  mapSpaceRow,
  mapWorkspaceTreeRow,
  type WorkspaceTreeRow,
} from './workMappers';

export interface WorkDataError {
  code: string;
  message: string;
  details: string | null;
  hint: string | null;
  userMessage: string;
}

const WORK_LOAD_ERROR = 'Não foi possível carregar os dados do Work Management.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function normalizeWorkError(error: unknown): WorkDataError {
  if (!isRecord(error)) {
    return {
      code: 'WORK_UNKNOWN',
      message: 'Unknown Work data error',
      details: null,
      hint: null,
      userMessage: WORK_LOAD_ERROR,
    };
  }

  return {
    code: optionalString(error.code) ?? 'WORK_UNKNOWN',
    message: optionalString(error.message) ?? 'Unknown Work data error',
    details: optionalString(error.details),
    hint: optionalString(error.hint),
    userMessage: WORK_LOAD_ERROR,
  };
}

const WORKSPACE_FIELDS =
  'id,name,description,icon,color,owner,created_at,updated_at';

const WORKSPACE_TREE_FIELDS = `
  ${WORKSPACE_FIELDS},
  spaces(
    id,workspace_id,name,description,status,icon,color,custom_statuses,position,created_at,updated_at,
    folders(id,space_id,name,description,icon,color,custom_statuses,position,created_at,updated_at),
    lists(id,space_id,folder_id,name,description,icon,color,custom_statuses,position,created_at,updated_at)
  )
`;

const TASK_FIELDS = `
  id,list_id,title,description,status,priority,due_date,assignee_id,creator_id,
  tags,estimated_hours,actual_hours,position,created_at,updated_at,completed_at,
  assignee:app_users!tasks_assignee_id_fkey(id,name,email),
  creator:app_users!tasks_creator_id_fkey(id,name,email)
`;

type AppUserSummary = Pick<Tables<'app_users'>, 'id' | 'name' | 'email'>;
type TaskQueryRow = Tables<'tasks'> & {
  assignee: AppUserSummary | null;
  creator: AppUserSummary | null;
};

const TASK_PRIORITIES: readonly TaskPriority[] = [
  'Baixa',
  'Média',
  'Alta',
  'Urgente',
];

function mapTaskPriority(value: string): TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : 'Média';
}

function mapTask(row: TaskQueryRow): HierarchyTask {
  return {
    ...row,
    priority: mapTaskPriority(row.priority),
    assignee: row.assignee ?? undefined,
    creator: row.creator ?? undefined,
  };
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select(WORKSPACE_FIELDS)
    .order('created_at', { ascending: false });

  if (error) throw normalizeWorkError(error);
  return data ?? [];
}

export async function fetchWorkspaceTree(
  workspaceId: string,
): Promise<WorkspaceTree> {
  const { data, error } = await supabase
    .from('workspaces')
    .select(WORKSPACE_TREE_FIELDS)
    .eq('id', workspaceId)
    .single();

  if (error) throw normalizeWorkError(error);
  return mapWorkspaceTreeRow(data as WorkspaceTreeRow);
}

export async function fetchTasksByList(
  listId: string,
  filters?: TaskFilters,
): Promise<HierarchyTask[]> {
  let query = supabase
    .from('tasks')
    .select(TASK_FIELDS)
    .eq('list_id', listId)
    .order('position');

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.priority) query = query.eq('priority', filters.priority);
  if (filters?.assignee_id) query = query.eq('assignee_id', filters.assignee_id);
  if (filters?.due_date_from) query = query.gte('due_date', filters.due_date_from);
  if (filters?.due_date_to) query = query.lte('due_date', filters.due_date_to);
  if (filters?.tags?.length) query = query.contains('tags', filters.tags);
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw normalizeWorkError(error);
  return ((data ?? []) as TaskQueryRow[]).map(mapTask);
}

export async function updateWorkspace(
  id: string,
  data: UpdateWorkspaceData,
): Promise<Workspace> {
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .update(data)
    .eq('id', id)
    .select(WORKSPACE_FIELDS)
    .single();

  if (error) throw normalizeWorkError(error);
  return workspace;
}

export async function createWorkspace(
  data: CreateWorkspaceData,
): Promise<Workspace> {
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert(data)
    .select(WORKSPACE_FIELDS)
    .single();

  if (error) throw normalizeWorkError(error);

  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: data.owner,
    role: 'owner',
  });

  if (memberError) {
    await supabase.from('workspaces').delete().eq('id', workspace.id);
    throw normalizeWorkError(memberError);
  }

  return workspace;
}

export async function deleteWorkspace(id: string): Promise<void> {
  const { error } = await supabase.from('workspaces').delete().eq('id', id);
  if (error) throw normalizeWorkError(error);
}

export async function createSpace(data: CreateSpaceData): Promise<Space> {
  const { data: space, error } = await supabase
    .from('spaces')
    .insert(data)
    .select('*')
    .single();

  if (error) throw normalizeWorkError(error);
  return mapSpaceRow(space);
}

export async function updateSpace(
  id: string,
  data: UpdateSpaceData,
): Promise<Space> {
  const { data: space, error } = await supabase
    .from('spaces')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw normalizeWorkError(error);
  return mapSpaceRow(space);
}

export async function deleteSpace(id: string): Promise<void> {
  const { error } = await supabase.from('spaces').delete().eq('id', id);
  if (error) throw normalizeWorkError(error);
}

export async function createTask(data: CreateTaskData): Promise<HierarchyTask> {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert(data)
    .select(TASK_FIELDS)
    .single();

  if (error) throw normalizeWorkError(error);
  return mapTask(task as TaskQueryRow);
}

export async function updateTask(
  id: string,
  data: UpdateTaskData,
): Promise<HierarchyTask> {
  const { data: task, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', id)
    .select(TASK_FIELDS)
    .single();

  if (error) throw normalizeWorkError(error);
  return mapTask(task as TaskQueryRow);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw normalizeWorkError(error);
}
