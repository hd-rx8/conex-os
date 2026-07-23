import type { PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { useWorkViewMode } from './useWorkViewMode';

function wrapper({ children }: PropsWithChildren) {
  return (
    <MemoryRouter initialEntries={['/work/tasks']}>{children}</MemoryRouter>
  );
}

describe('useWorkViewMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists a contextual view preference', () => {
    const { result } = renderHook(
      () => useWorkViewMode('workspace', 'workspace-1'),
      { wrapper },
    );

    act(() => result.current.setView('board'));

    expect(result.current.view).toBe('board');
    expect(
      localStorage.getItem('conex.work.view.workspace.workspace-1'),
    ).toBe('board');
  });

  it('restores the saved view when the URL has no view parameter', () => {
    localStorage.setItem('conex.work.view.list.list-1', 'table');

    const { result } = renderHook(
      () => useWorkViewMode('list', 'list-1'),
      { wrapper },
    );

    expect(result.current.view).toBe('table');
  });
});
