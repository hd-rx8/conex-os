import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Definindo os tipos de módulos disponíveis
export type AppModuleType = 'crm' | 'work';

// Interface para o contexto
interface AppModuleContextType {
  activeModule: AppModuleType;
  setActiveModule: (module: AppModuleType) => void;
  switchToModule: (module: AppModuleType) => void;
}

// Criando o contexto
const AppModuleContext = createContext<AppModuleContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useAppModule = () => {
  const context = useContext(AppModuleContext);
  if (!context) {
    throw new Error('useAppModule deve ser usado dentro de um AppModuleProvider');
  }
  return context;
};

// Rotas iniciais para cada módulo
const MODULE_HOME_ROUTES: Record<AppModuleType, string> = {
  crm: '/',
  work: '/projects'
};

// Provedor do contexto
export const AppModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  // Inicializa com o valor do localStorage ou padrão 'crm'
  const [activeModule, setActiveModuleState] = useState<AppModuleType>(() => {
    const savedModule = localStorage.getItem('app_module');
    return (savedModule === 'crm' || savedModule === 'work') 
      ? savedModule 
      : 'crm';
  });

  // Função para alterar o módulo ativo e navegar para a rota inicial do módulo
  const switchToModule = (module: AppModuleType) => {
    setActiveModuleState(module);
    navigate(MODULE_HOME_ROUTES[module]);
  };

  // Função para apenas alterar o módulo ativo
  const setActiveModule = (module: AppModuleType) => {
    setActiveModuleState(module);
  };

  // Persiste o módulo ativo no localStorage
  useEffect(() => {
    localStorage.setItem('app_module', activeModule);
  }, [activeModule]);

  return (
    <AppModuleContext.Provider value={{ activeModule, setActiveModule, switchToModule }}>
      {children}
    </AppModuleContext.Provider>
  );
};
