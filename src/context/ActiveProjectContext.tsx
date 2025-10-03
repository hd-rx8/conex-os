import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveProjectContextType {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
}

const ActiveProjectContext = createContext<ActiveProjectContextType | undefined>(undefined);

export const useActiveProject = () => {
  const context = useContext(ActiveProjectContext);
  if (!context) {
    // Return a default fallback instead of throwing error
    console.warn('useActiveProject used outside of ActiveProjectProvider, returning fallback');
    return {
      activeProjectId: null,
      setActiveProjectId: () => {
        console.warn('setActiveProjectId called outside of ActiveProjectProvider');
      }
    };
  }
  return context;
};

interface ActiveProjectProviderProps {
  children: ReactNode;
}

export const ActiveProjectProvider: React.FC<ActiveProjectProviderProps> = ({ children }) => {
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => {
    // Load from localStorage on initialization
    return localStorage.getItem('active_project_id');
  });

  const setActiveProjectId = (id: string | null) => {
    setActiveProjectIdState(id);
    if (id) {
      localStorage.setItem('active_project_id', id);
    } else {
      localStorage.removeItem('active_project_id');
    }
  };

  return (
    <ActiveProjectContext.Provider value={{ activeProjectId, setActiveProjectId }}>
      {children}
    </ActiveProjectContext.Provider>
  );
};
