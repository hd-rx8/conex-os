export const WORK_HOME = '/work';
export const WORK_TASKS = '/work/tasks';
export const WORK_BOARD = '/work/board';
export const WORK_WORKSPACES = '/work/workspaces';

export function legacyWorkRedirect(pathname: string): string {
  if (pathname === '/projects') return WORK_HOME;
  if (pathname === '/projects/tasks') return WORK_TASKS;
  if (pathname === '/projects/board') return WORK_BOARD;

  const projectId = pathname.match(/^\/projects\/([^/]+)$/)?.[1];
  return projectId ? `${WORK_HOME}/project/${projectId}` : WORK_HOME;
}
