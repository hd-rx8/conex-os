import { createContext, useContext } from 'react';

export interface WorkContextValue {
  selectedWorkspaceId?: string;
  setSelectedWorkspaceId: (workspaceId?: string) => void;
}

export const WorkContext = createContext<WorkContextValue | null>(null);

export function useWorkContext(): WorkContextValue {
  const value = useContext(WorkContext);
  if (!value) {
    throw new Error('useWorkContext deve ser usado dentro de WorkContextProvider');
  }
  return value;
}
