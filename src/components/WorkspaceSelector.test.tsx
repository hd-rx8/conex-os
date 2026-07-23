import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Workspace } from '@/types/hierarchy';

import WorkspaceSelector from './WorkspaceSelector';

const workspace = {
  id: 'workspace-1',
  name: 'Workspace principal com um nome extremamente longo',
  icon: '🏢',
} as Workspace;

describe('WorkspaceSelector', () => {
  it('keeps a long workspace and add button inside the sidebar row', () => {
    render(
      <WorkspaceSelector
        workspaces={[workspace]}
        selectedWorkspaceId={workspace.id}
        onSelect={vi.fn()}
        onCreateProject={vi.fn()}
      />,
    );

    const row = screen.getByTestId('workspace-selector-row');
    const trigger = screen.getByRole('combobox');
    const add = screen.getByRole('button', { name: 'Criar projeto' });

    expect(row).toHaveClass('w-full', 'min-w-0');
    expect(trigger).toHaveClass('w-0', 'min-w-0', 'flex-1');
    expect(add).toHaveClass('w-10', 'shrink-0');
  });

  it('keeps the collapsed state compact and labelled', () => {
    render(
      <WorkspaceSelector
        workspaces={[workspace]}
        selectedWorkspaceId={workspace.id}
        onSelect={vi.fn()}
        isCollapsed
      />,
    );

    expect(
      screen.getByRole('img', { name: `Workspace atual: ${workspace.name}` }),
    ).toBeInTheDocument();
  });
});
