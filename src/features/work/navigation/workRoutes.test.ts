import { describe, expect, it } from 'vitest';

import {
  legacyWorkRedirect,
  WORK_BOARD,
  WORK_HOME,
  WORK_TASKS,
  WORK_WORKSPACES,
} from './workRoutes';

describe('Work routes', () => {
  it('mantém /work como entrada canônica', () => {
    expect(WORK_HOME).toBe('/work');
    expect(WORK_TASKS).toBe('/work/tasks');
    expect(WORK_BOARD).toBe('/work/board');
    expect(WORK_WORKSPACES).toBe('/work/workspaces');
  });

  it.each([
    ['/projects', '/work'],
    ['/projects/tasks', '/work/tasks'],
    ['/projects/board', '/work/board'],
    ['/projects/abc', '/work/project/abc'],
  ])('redireciona %s para %s', (legacyPath, expected) => {
    expect(legacyWorkRedirect(legacyPath)).toBe(expected);
  });
});
