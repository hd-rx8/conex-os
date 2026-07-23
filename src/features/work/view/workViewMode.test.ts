import { describe, expect, it } from 'vitest';

import {
  resolveWorkViewMode,
  workViewPreferenceKey,
} from './workViewMode';

describe('resolveWorkViewMode', () => {
  it('prefers a valid URL value', () => {
    expect(resolveWorkViewMode('?view=board', 'table')).toBe('board');
  });

  it('uses a valid saved preference when the URL is absent', () => {
    expect(resolveWorkViewMode('', 'table')).toBe('table');
  });

  it('falls back to list for malformed values', () => {
    expect(resolveWorkViewMode('?view=calendar', 'gantt')).toBe('list');
  });
});

describe('workViewPreferenceKey', () => {
  it('scopes the preference by context type and id', () => {
    expect(workViewPreferenceKey('workspace', 'workspace-1')).toBe(
      'conex.work.view.workspace.workspace-1',
    );
  });
});
