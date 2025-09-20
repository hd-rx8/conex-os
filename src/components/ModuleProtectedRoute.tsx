import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppModule, AppModuleType } from '@/context/AppModuleContext';

interface ModuleProtectedRouteProps {
  children: React.ReactNode;
  requiredModule: AppModuleType;
  redirectTo?: string;
}

/**
 * Componente para proteger rotas com base no módulo ativo
 * Se o módulo ativo não corresponder ao requiredModule, redireciona para a rota especificada
 */
const ModuleProtectedRoute: React.FC<ModuleProtectedRouteProps> = ({
  children,
  requiredModule,
  redirectTo = '/'
}) => {
  const { activeModule } = useAppModule();

  if (activeModule !== requiredModule) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ModuleProtectedRoute;
