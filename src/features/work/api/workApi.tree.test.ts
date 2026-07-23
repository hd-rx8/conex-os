import { describe, expect, it } from 'vitest';

import { WORKSPACE_TREE_FIELDS } from './workApi';

describe('WORKSPACE_TREE_FIELDS', () => {
  it('loads canonical lists directly from workspace folders', () => {
    expect(WORKSPACE_TREE_FIELDS.replace(/\s+/g, '')).toContain(
      'workspace_folders(id,workspace_id,name,description,icon,color,position,created_at,updated_at,lists(id,workspace_id,workspace_folder_id,space_id,folder_id,name,description,icon,color,custom_statuses,position,created_at,updated_at))',
    );
  });
});
