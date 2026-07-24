import { supabase } from '@/integrations/supabase/client';
import type {
  CreateSpaceData,
  CreateTaskData,
  CreateWorkspaceData,
  Space,
  TaskFilters,
  UpdateSpaceData,
  UpdateTaskData,
  UpdateWorkspaceData,
  WorkTaskItem,
  Workspace,
  WorkspaceTree,
} from '@/types/hierarchy';

import {
  mapSpaceRow,
  mapWorkTaskRow,
  mapWorkspaceTreeRow,
  type WorkTaskQueryRow,
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

export const WORKSPACE_TREE_FIELDS = `
  ${WORKSPACE_FIELDS},
  workspace_folders(
    id,workspace_id,name,description,icon,color,position,created_at,updated_at,
    lists(id,workspace_id,workspace_folder_id,space_id,folder_id,name,description,icon,color,custom_statuses,position,created_at,updated_at)
  ),
  spaces(
    id,workspace_id,workspace_folder_id,name,description,status,icon,color,custom_statuses,position,created_at,updated_at,
    folders(id,space_id,name,description,icon,color,custom_statuses,position,created_at,updated_at),
    lists(id,space_id,folder_id,name,description,icon,color,custom_statuses,position,created_at,updated_at)
  )
`;

const WORK_TASK_FIELDS = `
  id,list_id,title,description,status,priority,due_date,assignee_id,creator_id,
  tags,estimated_hours,actual_hours,position,created_at,updated_at,completed_at,
  assignee:app_users!tasks_assignee_id_fkey(id,name,email),
  creator:app_users!tasks_creator_id_fkey(id,name,email),
  list:lists!inner(
    id,name,color,workspace_id,workspace_folder_id,space_id,
    space:spaces(id,name,color,workspace_id),
    workspace:workspaces(id,name,color,icon)
  )
`;

function createTaskQuery() {
  return supabase.from('tasks').select(WORK_TASK_FIELDS);
}

type TaskQuery = ReturnType<typeof createTaskQuery>;

function applyTaskFilters(
  initialQuery: TaskQuery,
  filters?: TaskFilters,
): TaskQuery {
  let query = initialQuery;
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.priority) query = query.eq('priority', filters.priority);
  if (filters?.assignee_id) query = query.eq('assignee_id', filters.assignee_id);
  if (filters?.space_id) query = query.eq('list.space_id', filters.space_id);
  if (filters?.list_id) query = query.eq('list_id', filters.list_id);
  if (filters?.due_date_from) query = query.gte('due_date', filters.due_date_from);
  if (filters?.due_date_to) query = query.lte('due_date', filters.due_date_to);
  if (filters?.tags?.length) query = query.contains('tags', filters.tags);
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`);
  return query;
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
  if (workspaceId === 'all') {
    const { data, error } = await supabase
      .from('workspaces')
      .select(WORKSPACE_TREE_FIELDS);

    if (error) throw normalizeWorkError(error);

    const workspaces = (data as WorkspaceTreeRow[])?.map(mapWorkspaceTreeRow) ?? [];

    return {
      id: 'all',
      name: 'Visão Geral',
      description: '',
      icon: '🌐',
      color: '#000000',
      owner: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      workspace_folders: workspaces.flatMap(w => w.workspace_folders || []),
      spaces: workspaces.flatMap(w => w.spaces || []),
    };
  }

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
): Promise<WorkTaskItem[]> {
  const query = applyTaskFilters(
    createTaskQuery().eq('list_id', listId),
    filters,
  ).order('position');

  const { data, error } = await query;
  if (error) throw normalizeWorkError(error);
  return ((data ?? []) as WorkTaskQueryRow[]).map(mapWorkTaskRow);
}

export async function fetchWorkspaceTasks(
  workspaceId: string,
  filters?: TaskFilters,
): Promise<WorkTaskItem[]> {
  const baseQuery = workspaceId === 'all' 
    ? createTaskQuery() 
    : createTaskQuery().eq('list.workspace_id', workspaceId);

  const query = applyTaskFilters(
    baseQuery,
    filters,
  ).order('position');

  const { data, error } = await query;
  if (error) throw normalizeWorkError(error);
  return ((data ?? []) as WorkTaskQueryRow[]).map(mapWorkTaskRow);
}

export async function fetchAssignedTasks(
  workspaceId: string,
  assigneeId: string,
  filters?: TaskFilters,
): Promise<WorkTaskItem[]> {
  return fetchWorkspaceTasks(workspaceId, {
    ...filters,
    assignee_id: assigneeId,
  });
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

  // Auto-create a default list
  await supabase.from('lists').insert({
    name: 'Geral',
    space_id: space.id,
    workspace_id: space.workspace_id,
    workspace_folder_id: space.workspace_folder_id,
    icon: '📋',
    color: space.color,
  });

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

export async function createTask(data: CreateTaskData): Promise<WorkTaskItem> {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert(data)
    .select(WORK_TASK_FIELDS)
    .single();

  if (error) throw normalizeWorkError(error);
  return mapWorkTaskRow(task as WorkTaskQueryRow);
}

export async function updateTask(
  id: string,
  data: UpdateTaskData,
): Promise<WorkTaskItem> {
  const { data: task, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', id)
    .select(WORK_TASK_FIELDS)
    .single();

  if (error) throw normalizeWorkError(error);
  return mapWorkTaskRow(task as WorkTaskQueryRow);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw normalizeWorkError(error);
}
