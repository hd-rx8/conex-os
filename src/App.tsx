import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppModuleProvider, useAppModule } from "./context/AppModuleContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Users from "./pages/Users";
import Proposals from "./pages/Proposals";
import ProposalPrint from "./pages/ProposalPrint";
import Clients from "./pages/Clients";
import Pipeline from "./pages/Pipeline";
import QuoteGeneratorPage from "./pages/QuoteGeneratorPage";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import PublicProposalView from "./pages/PublicProposalView";
// Importar as páginas do módulo de projetos
import ProjectsOverview from "./pages/projects/ProjectsOverview";
import ProjectDetail from "./pages/projects/ProjectDetail";
import TasksBoard from "./pages/projects/TasksBoard";
import MyTasks from "./pages/projects/MyTasks";
import { useSession } from "./hooks/useSession";
import { useUsers } from "./hooks/useUsers";
import ModuleProtectedRoute from "./components/ModuleProtectedRoute";
import { ThemeProvider } from "next-themes";
import { GradientThemeProvider } from "./context/GradientThemeContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { QuoteWizardProvider } from "./context/QuoteWizardContext";

const queryClient = new QueryClient();

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
    <QuoteWizardProvider userId={user?.id || ''}>
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
              <ModuleProtectedRoute requiredModule="crm" redirectTo="/projects">
                <Clients />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/generator" 
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="crm" redirectTo="/projects">
                <QuoteGeneratorPage userId={user.id} />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/proposals" 
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="crm" redirectTo="/projects">
                <Proposals />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/proposals/:id/print" 
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="crm" redirectTo="/projects">
                <ProposalPrint />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/pipeline"
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="crm" redirectTo="/projects">
                <Pipeline />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" replace />} 
        />

        {/* Rotas do módulo de Projetos */}
        <Route 
          path="/projects" 
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <ProjectsOverview />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/projects/:projectId" 
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <ProjectDetail />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/projects/tasks" 
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <MyTasks />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/projects/board" 
          element={
            user ? (
              <ModuleProtectedRoute requiredModule="work" redirectTo="/">
                <TasksBoard />
              </ModuleProtectedRoute>
            ) : <Navigate to="/login" replace />
          } 
        />

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
    </QuoteWizardProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" attribute="class">
      <GradientThemeProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppModuleProvider>
                <AppContent />
              </AppModuleProvider>
            </BrowserRouter>
          </TooltipProvider>
        </CurrencyProvider>
      </GradientThemeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;