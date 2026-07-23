import { describe, expect, it } from 'vitest';

import { legacyWorkRedirect, WORK_HOME } from './workRoutes';

describe('Work routes', () => {
  it('mantém /work como entrada canônica', () => {
    expect(WORK_HOME).toBe('/work');
  });

  it.each([
    ['/projects', '/work'],
    ['/projects/tasks', '/work'],
    ['/projects/abc', '/work/project/abc'],
  ])('redireciona %s para %s', (legacyPath, expected) => {
    expect(legacyWorkRedirect(legacyPath)).toBe(expected);
  });
});
