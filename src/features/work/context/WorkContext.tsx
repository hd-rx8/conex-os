import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';

const WORKSPACE_PREFERENCE_KEY = 'conex.work.workspace';

interface WorkContextValue {
  selectedWorkspaceId?: string;
  setSelectedWorkspaceId: (workspaceId?: string) => void;
}

const WorkContext = createContext<WorkContextValue | null>(null);

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

export function useWorkContext(): WorkContextValue {
  const value = useContext(WorkContext);
  if (!value) {
    throw new Error('useWorkContext deve ser usado dentro de WorkContextProvider');
  }
  return value;
}
