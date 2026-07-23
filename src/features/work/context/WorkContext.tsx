import {
  type PropsWithChildren,
  useMemo,
  useState,
} from 'react';

import {
  WorkContext,
  type WorkContextValue,
} from './workContextState';

const WORKSPACE_PREFERENCE_KEY = 'conex.work.workspace';

export function WorkContextProvider({ children }: PropsWithChildren) {
  const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<
    string | undefined
  >(() => localStorage.getItem(WORKSPACE_PREFERENCE_KEY) ?? undefined);

  const value = useMemo<WorkContextValue>(
    () => ({
      selectedWorkspaceId,
      setSelectedWorkspaceId: (workspaceId) => {
        setSelectedWorkspaceIdState(workspaceId);
        if (workspaceId) {
          localStorage.setItem(WORKSPACE_PREFERENCE_KEY, workspaceId);
        } else {
          localStorage.removeItem(WORKSPACE_PREFERENCE_KEY);
        }
      },
    }),
    [selectedWorkspaceId],
  );

  return <WorkContext.Provider value={value}>{children}</WorkContext.Provider>;
}
