import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Routes, Route, Navigate, RouterProvider, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppModuleProvider } from "./context/AppModuleContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
// Importar as páginas do módulo CRM
import Opportunities from "./pages/crm/Opportunities";
import ProposalPrint from "./pages/crm/ProposalPrint";
import Clients from "./pages/crm/Clients";
import QuoteGeneratorRoute from "./pages/crm/QuoteGeneratorRoute";
import PublicProposalView from "./pages/crm/PublicProposalView";
import { useSession } from "./hooks/useSession";
import { useUsers } from "./hooks/useUsers";
import ModuleProtectedRoute from "./components/ModuleProtectedRoute";
import { ThemeProvider } from "next-themes";
import { GradientThemeProvider } from "./context/GradientThemeContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { ActiveProjectProvider } from "./context/ActiveProjectContext";
import {
  WORK_BOARD,
  WORK_HOME,
  WORK_TASKS,
  WORK_WORKSPACES,
} from "./features/work/navigation/workRoutes";
import { WorkContextProvider } from "./features/work/context/WorkContext";

const WorkOverview = lazy(() => import("./pages/work/WorkOverview"));
const WorkTasks = lazy(() => import("./pages/work/WorkTasks"));
const WorkBoard = lazy(() => import("./pages/work/WorkBoard"));
const ProjectDetails = lazy(() => import("./pages/work/ProjectDetails"));
const WorkspaceSettings = lazy(() => import("./pages/work/WorkspaceSettings"));
const ListDetails = lazy(() => import("./pages/work/ListDetails"));

const queryClient = new QueryClient();

const LegacyWorkProjectRedirect = () => {
  const { projectId } = useParams<{ projectId: string }>();
  return <Navigate to={projectId ? `${WORK_HOME}/project/${projectId}` : WORK_HOME} replace />;
};

const AppContent = () => {
  const { user, session, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
            Carregando módulo…
          </div>
        }
      >
        <Routes>
        {/* Rotas do módulo CRM */}
        <Route 
          path="/" 
          element={user ? <Index /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/users" 
          element={user ? <Users /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/clients"
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="crm" redirectTo={WORK_HOME}>
                <Clients />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/generator" 
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="crm" redirectTo={WORK_HOME}>
                <QuoteGeneratorRoute userId={user.id} mode="create" />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route
          path="/generator/:proposalId/edit"
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="crm" redirectTo={WORK_HOME}>
                <QuoteGeneratorRoute userId={user.id} mode="edit" />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/opportunities"
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="crm" redirectTo={WORK_HOME}>
                <Opportunities />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/proposals/:id/print"
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="crm" redirectTo={WORK_HOME}>
                <ProposalPrint />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          }
        />
        {/* Redirect old routes to new unified page */}
        <Route path="/proposals" element={<Navigate to="/opportunities" replace />} />
        <Route path="/pipeline" element={<Navigate to="/opportunities" replace />} />
        <Route 
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" replace />} 
        />

        {/* Rotas do módulo de Projetos */}
        <Route
          path="/work"
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <WorkOverview />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          }
        />
        <Route
          path={WORK_TASKS}
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <WorkTasks />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          }
        />
        <Route
          path={WORK_BOARD}
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <WorkBoard />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/work/project/:projectId"
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <ProjectDetails />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          }
        />
        <Route
          path={WORK_WORKSPACES}
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <WorkspaceSettings />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/work/list/:listId"
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <ListDetails />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          }
        />
        <Route path="/projects" element={<Navigate to={WORK_HOME} replace />} />
        <Route path="/projects/list" element={<Navigate to={WORK_HOME} replace />} />
        <Route path="/projects/tasks" element={<Navigate to={WORK_TASKS} replace />} />
        <Route path="/projects/board" element={<Navigate to={WORK_BOARD} replace />} />
        <Route path="/projects/:projectId" element={<LegacyWorkProjectRedirect />} />

        {/* Rotas de autenticação */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <Signup /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />
        <Route 
          path="/p/:share_token" 
          element={<PublicProposalView />}
        />
        <Route path="*" element={<NotFound />} />
        </Routes>
    </Suspense>
  );
};

const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <AppModuleProvider>
        <WorkContextProvider>
          <ActiveProjectProvider>
            <AppContent />
          </ActiveProjectProvider>
        </WorkContextProvider>
      </AppModuleProvider>
    ),
  },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" attribute="class">
      <GradientThemeProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <RouterProvider router={router} />
          </TooltipProvider>
        </CurrencyProvider>
      </GradientThemeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
