import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const ExportDataSchema = z.object({
  version: z.literal('1.0'),
  workspaces: z.array(z.record(z.any())),
  workspace_folders: z.array(z.record(z.any())),
  spaces: z.array(z.record(z.any())),
  folders: z.array(z.record(z.any())),
  lists: z.array(z.record(z.any())),
  tasks: z.array(z.record(z.any())),
});

export type ExportData = z.infer<typeof ExportDataSchema>;

/**
 * Exports all data for a specific workspace (or all workspaces if workspaceId is not provided).
 * To be safe, we'll export ALL data the user has access to for simplicity in this MVP,
 * or restrict by workspaceId. Let's do ALL workspaces for a full backup.
 */
export async function exportUserData(): Promise<ExportData> {
  const [
    { data: workspaces },
    { data: workspace_folders },
    { data: spaces },
    { data: folders },
    { data: lists },
    { data: tasks },
  ] = await Promise.all([
    supabase.from('workspaces').select('*'),
    supabase.from('workspace_folders').select('*'),
    supabase.from('spaces').select('*'),
    supabase.from('folders').select('*'),
    supabase.from('lists').select('*'),
    supabase.from('tasks').select('*'),
  ]);

  if (!workspaces || !workspace_folders || !spaces || !folders || !lists || !tasks) {
    throw new Error('Erro ao buscar dados para exportação');
  }

  return {
    version: '1.0',
    workspaces,
    workspace_folders,
    spaces,
    folders,
    lists,
    tasks,
  };
}

/**
 * Imports data into the system, generating new UUIDs for every record to avoid collisions.
 */
export async function importUserData(jsonData: unknown, currentUserId: string): Promise<void> {
  const parsedData = ExportDataSchema.parse(jsonData);

  // Mapeamento de IDs antigos para novos
  const idMap: Record<string, string> = {};
  const getNewId = (oldId: string | null | undefined) => {
    if (!oldId) return oldId;
    return idMap[oldId] || oldId; // fallback for unmapped, though usually bad
  };

  const generateMappedArray = (arr: Record<string, any>[], foreignKeys: string[], ownerKeys: string[] = []) => {
    return arr.map(item => {
      const newId = crypto.randomUUID();
      idMap[item.id] = newId;

      const mappedItem = { ...item, id: newId };

      // Update foreign keys
      for (const fk of foreignKeys) {
        if (mappedItem[fk]) {
          mappedItem[fk] = getNewId(mappedItem[fk]);
        }
      }

      // Update owner/creator keys to the current user
      for (const ok of ownerKeys) {
        mappedItem[ok] = currentUserId;
      }

      // We don't want to import created_at / updated_at exactly as is if there are conflicts,
      // but keeping them is fine. Let's keep them.

      // If it's a task, let's nullify the assignee_id to prevent assigning to someone who doesn't exist here
      if ('assignee_id' in mappedItem) {
        mappedItem.assignee_id = null;
      }

      return mappedItem;
    });
  };

  const newWorkspaces = generateMappedArray(parsedData.workspaces, [], ['owner']);
  const newWorkspaceFolders = generateMappedArray(parsedData.workspace_folders, ['workspace_id']);
  const newSpaces = generateMappedArray(parsedData.spaces, ['workspace_id', 'workspace_folder_id']);
  const newFolders = generateMappedArray(parsedData.folders, ['space_id']);
  const newLists = generateMappedArray(parsedData.lists, ['space_id', 'folder_id']);
  const newTasks = generateMappedArray(parsedData.tasks, ['list_id'], ['creator_id']);

  // Insert in order of dependencies
  if (newWorkspaces.length > 0) {
    const { error } = await supabase.from('workspaces').insert(newWorkspaces);
    if (error) throw new Error(`Erro importando workspaces: ${error.message}`);
  }

  if (newWorkspaceFolders.length > 0) {
    const { error } = await supabase.from('workspace_folders').insert(newWorkspaceFolders);
    if (error) throw new Error(`Erro importando pastas de workspace: ${error.message}`);
  }

  if (newSpaces.length > 0) {
    const { error } = await supabase.from('spaces').insert(newSpaces);
    if (error) throw new Error(`Erro importando projetos: ${error.message}`);
  }

  if (newFolders.length > 0) {
    const { error } = await supabase.from('folders').insert(newFolders);
    if (error) throw new Error(`Erro importando pastas: ${error.message}`);
  }

  if (newLists.length > 0) {
    const { error } = await supabase.from('lists').insert(newLists);
    if (error) throw new Error(`Erro importando listas: ${error.message}`);
  }

  if (newTasks.length > 0) {
    // Tasks might be too many for a single insert, chunk them just in case (e.g. 500 max)
    const chunkSize = 500;
    for (let i = 0; i < newTasks.length; i += chunkSize) {
      const chunk = newTasks.slice(i, i + chunkSize);
      const { error } = await supabase.from('tasks').insert(chunk);
      if (error) throw new Error(`Erro importando tarefas: ${error.message}`);
    }
  }
}
