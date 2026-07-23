import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { WorkTaskItem } from '@/types/hierarchy';

import { TaskBoardView } from './TaskBoardView';
import { TaskListView } from './TaskListView';
import { TaskTableView } from './TaskTableView';
import { WorkViewSwitcher } from './WorkViewSwitcher';

const task: WorkTaskItem = {
  id: 'task-1',
  list_id: 'list-1',
  title: 'Preparar proposta',
  description: 'Escopo comercial',
  status: 'Pendente',
  priority: 'Urgente',
  due_date: '2026-07-25T12:00:00Z',
  assignee_id: 'user-1',
  creator_id: 'user-1',
  tags: ['cliente'],
  estimated_hours: null,
  actual_hours: null,
  position: 0,
  created_at: '2026-07-22T12:00:00Z',
  updated_at: '2026-07-22T12:00:00Z',
  completed_at: null,
  assignee: { id: 'user-1', name: 'Hendrix', email: null },
  context: {
    workspace_id: 'workspace-1',
    space_id: 'space-1',
    space_name: 'Website',
    list_id: 'list-1',
    list_name: 'Comercial',
  },
};

describe.each([
  ['list', TaskListView],
  ['table', TaskTableView],
] as const)('shared %s view', (name, Component) => {
  it('renders task context from the normalized collection', () => {
    render(<Component tasks={[task]} />);

    expect(screen.getByTestId(`work-${name}-view`)).toBeInTheDocument();
    expect(screen.getByText('Preparar proposta')).toBeInTheDocument();
    expect(screen.getByText(/Website/)).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });
});

describe('TaskBoardView', () => {
  it('offers an accessible status-change control in addition to drag and drop', () => {
    render(<TaskBoardView tasks={[task]} onStatusChange={vi.fn()} />);

    expect(screen.getByTestId('work-board-view')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Alterar status de Preparar proposta',
      }),
    ).toBeInTheDocument();
  });
});

describe('WorkViewSwitcher', () => {
  it('marks the selected view and emits the next choice', () => {
    const onChange = vi.fn();
    render(<WorkViewSwitcher value="list" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Tabela' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Kanban' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
