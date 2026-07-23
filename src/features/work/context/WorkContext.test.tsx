import type { PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  useWorkContext,
  WorkContextProvider,
} from './WorkContext';

function wrapper({ children }: PropsWithChildren) {
  return <WorkContextProvider>{children}</WorkContextProvider>;
}

describe('WorkContextProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shares and persists the selected workspace', () => {
    const { result } = renderHook(() => useWorkContext(), { wrapper });

    act(() => result.current.setSelectedWorkspaceId('workspace-1'));

    expect(result.current.selectedWorkspaceId).toBe('workspace-1');
    expect(localStorage.getItem('conex.work.workspace')).toBe('workspace-1');
  });

  it('restores a previously selected workspace', () => {
    localStorage.setItem('conex.work.workspace', 'workspace-2');

    const { result } = renderHook(() => useWorkContext(), { wrapper });

    expect(result.current.selectedWorkspaceId).toBe('workspace-2');
  });
});
