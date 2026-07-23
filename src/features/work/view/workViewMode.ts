export type WorkViewMode = 'list' | 'table' | 'board';

const WORK_VIEW_MODES = new Set<WorkViewMode>(['list', 'table', 'board']);

export function isWorkViewMode(value: string | null): value is WorkViewMode {
  return value !== null && WORK_VIEW_MODES.has(value as WorkViewMode);
}

export function resolveWorkViewMode(
  search: string,
  saved: string | null,
): WorkViewMode {
  const fromUrl = new URLSearchParams(search).get('view');
  if (isWorkViewMode(fromUrl)) return fromUrl;
  if (isWorkViewMode(saved)) return saved;
  return 'list';
}

export function workViewPreferenceKey(
  contextType: string,
  contextId: string,
): string {
  return `conex.work.view.${contextType}.${contextId}`;
}
