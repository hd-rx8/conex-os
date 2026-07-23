export const WORK_HOME = '/work';

export function legacyWorkRedirect(pathname: string): string {
  if (pathname === '/projects' || pathname === '/projects/tasks') {
    return WORK_HOME;
  }

  const projectId = pathname.match(/^\/projects\/([^/]+)$/)?.[1];
  return projectId ? `${WORK_HOME}/project/${projectId}` : WORK_HOME;
}
