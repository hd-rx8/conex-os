import { describe, expect, it } from 'vitest';

import { buildCanonicalListInsert } from './useLists';

describe('buildCanonicalListInsert', () => {
  it('keeps the legacy space relation while adding the canonical workspace folder path', () => {
    expect(
      buildCanonicalListInsert(
        {
          space_id: 'space-1',
          folder_id: null,
          name: 'Backlog',
          description: null,
        },
        {
          workspace_id: 'workspace-1',
          workspace_folder_id: 'workspace-folder-1',
        },
      ),
    ).toEqual({
      space_id: 'space-1',
      folder_id: null,
      name: 'Backlog',
      description: null,
      workspace_id: 'workspace-1',
      workspace_folder_id: 'workspace-folder-1',
    });
  });
});
