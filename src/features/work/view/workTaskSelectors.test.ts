import { describe, expect, it } from 'vitest';

import type { WorkTaskItem } from '@/types/hierarchy';

import {
  deriveWorkTaskMetrics,
  filterWorkTasks,
} from './workTaskSelectors';

const tasks: WorkTaskItem[] = [
  {
    id: 'task-pending',
    list_id: 'list-a',
    title: 'Preparar proposta Alpha',
    description: null,
    status: 'Pendente',
    priority: 'Alta',
    due_date: '2026-07-20T12:00:00Z',
    assignee_id: 'user-1',
    creator_id: 'user-1',
    tags: ['cliente'],
    estimated_hours: null,
    actual_hours: null,
    position: 0,
    created_at: '2026-07-01T12:00:00Z',
    updated_at: '2026-07-01T12:00:00Z',
    completed_at: null,
    context: {
      workspace_id: 'workspace-1',
      space_id: 'space-a',
      space_name: 'Alpha',
      list_id: 'list-a',
      list_name: 'Comercial',
    },
  },
  {
    id: 'task-progress',
    list_id: 'list-b',
    title: 'Revisar briefing Beta',
    description: null,
    status: 'Em Progresso',
    priority: 'Média',
    due_date: '2026-07-25T12:00:00Z',
    assignee_id: 'user-2',
    creator_id: 'user-1',
    tags: null,
    estimated_hours: null,
    actual_hours: null,
    position: 1,
    created_at: '2026-07-02T12:00:00Z',
    updated_at: '2026-07-02T12:00:00Z',
    completed_at: null,
    context: {
      workspace_id: 'workspace-1',
      space_id: 'space-b',
      space_name: 'Beta',
      list_id: 'list-b',
      list_name: 'Backlog',
    },
  },
  {
    id: 'task-complete',
    list_id: 'list-b',
    title: 'Publicar entrega',
    description: null,
    status: 'Concluída',
    priority: 'Baixa',
    due_date: '2026-07-18T12:00:00Z',
    assignee_id: 'user-1',
    creator_id: 'user-1',
    tags: [],
    estimated_hours: null,
    actual_hours: null,
    position: 2,
    created_at: '2026-07-03T12:00:00Z',
    updated_at: '2026-07-03T12:00:00Z',
    completed_at: '2026-07-18T10:00:00Z',
    context: {
      workspace_id: 'workspace-1',
      space_id: 'space-b',
      space_name: 'Beta',
      list_id: 'list-b',
      list_name: 'Backlog',
    },
  },
];

describe('filterWorkTasks', () => {
  it('filters by search, status and project without mutating input', () => {
    const original = [...tasks];
    const result = filterWorkTasks(tasks, {
      search: 'alpha',
      status: 'Pendente',
      space_id: 'space-a',
    });

    expect(result).toEqual([tasks[0]]);
    expect(tasks).toEqual(original);
  });

  it('filters by tags and inclusive due-date boundaries', () => {
    expect(
      filterWorkTasks(tasks, {
        tags: ['cliente'],
        due_date_from: '2026-07-20T00:00:00Z',
        due_date_to: '2026-07-20T23:59:59Z',
      }),
    ).toEqual([tasks[0]]);
  });
});

describe('deriveWorkTaskMetrics', () => {
  it('derives status and overdue counts against an injected clock', () => {
    expect(
      deriveWorkTaskMetrics(tasks, new Date('2026-07-22T12:00:00Z')),
    ).toEqual({
      total: 3,
      pending: 1,
      inProgress: 1,
      completed: 1,
      overdue: 1,
    });
  });
});
