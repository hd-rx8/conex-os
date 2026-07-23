import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchWorkspaceTree,
  normalizeWorkError,
} from '@/features/work/api/workApi';
import { workQueryKeys } from '@/features/work/api/workQueryKeys';
import {
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useWorkspacesQuery,
} from '@/features/work/hooks/useWorkData';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type {
  CreateWorkspaceData,
  CreateWorkspaceMemberData,
  UpdateWorkspaceData,
  UpdateWorkspaceMemberData,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceTree,
} from '@/types/hierarchy';

const WORK_STALE_TIME = 30_000;
const WORKSPACE_ROLES: readonly WorkspaceRole[] = [
  'owner',
  'admin',
  'member',
  'viewer',
];

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error !== null && 'userMessage' in error) {
    return new Error(String(error.userMessage));
  }
  return new Error('Não foi possível concluir a operação no Work Management.');
}

export const useWorkspaces = (_userId?: string) => {
  const queryClient = useQueryClient();
  const query = useWorkspacesQuery();
  const createMutation = useCreateWorkspaceMutation();
  const updateMutation = useUpdateWorkspaceMutation();
  const deleteMutation = useDeleteWorkspaceMutation();

  const fetchWorkspaces = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const getWorkspaceTree = useCallback(
    (workspaceId: string): Promise<WorkspaceTree> =>
      queryClient.fetchQuery({
        queryKey: workQueryKeys.tree(workspaceId),
        queryFn: () => fetchWorkspaceTree(workspaceId),
        staleTime: WORK_STALE_TIME,
        retry: 1,
      }),
    [queryClient],
  );

  const createWorkspace = async (data: CreateWorkspaceData) => {
    try {
      return { data: await createMutation.mutateAsync(data), error: null };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  };

  const updateWorkspace = async (id: string, data: UpdateWorkspaceData) => {
    try {
      return {
        data: await updateMutation.mutateAsync({ id, data }),
        error: null,
      };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error: toError(error) };
    }
  };

  return {
    workspaces: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? toError(query.error) : null,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceTree,
  };
};
type MemberRow = Tables<'workspace_members'> & {
  app_users: Pick<Tables<'app_users'>, 'id' | 'name' | 'email'> | null;
};

function mapRole(role: string): WorkspaceRole {
  return WORKSPACE_ROLES.includes(role as WorkspaceRole)
    ? (role as WorkspaceRole)
    : 'viewer';
}

function mapMember(row: MemberRow): WorkspaceMember {
  return {
    ...row,
    role: mapRole(row.role),
    app_users: row.app_users ?? undefined,
  };
}

export const useWorkspaceMembers = (workspaceId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['work', 'members', workspaceId] as const;

  const query = useQuery({
    queryKey,
    enabled: Boolean(workspaceId),
    staleTime: WORK_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*, app_users(id, name, email)')
        .eq('workspace_id', workspaceId);

      if (error) throw normalizeWorkError(error);
      return ((data ?? []) as MemberRow[]).map(mapMember);
    },
  });

  const invalidateMembers = () =>
    queryClient.invalidateQueries({ queryKey, exact: true });

  const addMember = async (data: CreateWorkspaceMemberData) => {
    const { data: member, error } = await supabase
      .from('workspace_members')
      .insert(data)
      .select('*, app_users(id, name, email)')
      .single();

    if (error) return { data: null, error: toError(normalizeWorkError(error)) };
    await invalidateMembers();
    return { data: mapMember(member as MemberRow), error: null };
  };

  const updateMember = async (id: string, data: UpdateWorkspaceMemberData) => {
    const { data: member, error } = await supabase
      .from('workspace_members')
      .update(data)
      .eq('id', id)
      .select('*, app_users(id, name, email)')
      .single();

    if (error) return { data: null, error: toError(normalizeWorkError(error)) };
    await invalidateMembers();
    return { data: mapMember(member as MemberRow), error: null };
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', id);

    if (error) return { error: toError(normalizeWorkError(error)) };
    await invalidateMembers();
    return { error: null };
  };

  return {
    members: query.data ?? [],
    loading: query.isLoading,
    fetchMembers: query.refetch,
    addMember,
    updateMember,
    removeMember,
  };
};
