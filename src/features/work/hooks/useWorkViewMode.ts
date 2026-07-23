import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  resolveWorkViewMode,
  type WorkViewMode,
  workViewPreferenceKey,
} from '../view/workViewMode';

export function useWorkViewMode(contextType: string, contextId: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const preferenceKey = workViewPreferenceKey(contextType, contextId);
  const view = resolveWorkViewMode(
    `?${searchParams.toString()}`,
    localStorage.getItem(preferenceKey),
  );

  const setView = useCallback(
    (nextView: WorkViewMode) => {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set('view', nextView);
      setSearchParams(nextSearchParams, { replace: true });
      localStorage.setItem(preferenceKey, nextView);
    },
    [preferenceKey, searchParams, setSearchParams],
  );

  return { view, setView };
}
