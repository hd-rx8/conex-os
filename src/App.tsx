import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Users from "./pages/Users";
import Proposals from "./pages/Proposals";
import Clients from "./pages/Clients"; // Import the new Clients page
import Pipeline from "./pages/Pipeline"; // Import the new Pipeline page
import QuoteGeneratorPage from "./pages/QuoteGeneratorPage"; // Import the new QuoteGeneratorPage
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import PublicProposalView from "./pages/PublicProposalView"; // Import the new PublicProposalView
import { useSession } from "./hooks/useSession";
import { useUsers } from "./hooks/useUsers";
import Layout from "./components/Layout";
import { ThemeProvider } from "next-themes";
import { GradientThemeProvider } from "./context/GradientThemeContext";
import { CurrencyProvider } from "./context/CurrencyContext"; // Import CurrencyProvider
import { QuoteWizardProvider } from "./context/QuoteWizardContext"; // Import QuoteWizardProvider

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, session, loading } = useSession();
  // const { upsertCurrentUserProfile } = useUsers(); // Removed as app_users is now populated by trigger

  // Auto-onboarding: criar perfil do usuário logado
  // useEffect(() => {
  //   if (session && user) {
  //     upsertCurrentUserProfile(session); // Removed as app_users is now populated by trigger
  //   }
  // }, [session, user, upsertCurrentUserProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <QuoteWizardProvider userId={user?.id || ''}> {/* Moved QuoteWizardProvider here */}
      <Routes>
        <Route 
          path="/" 
          element={user ? <Index /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/users" 
          element={user ? <Users /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/clients" // New route for clients
          element={user ? <Clients /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/generator" 
          element={user ? <Layout><QuoteGeneratorPage userId={user.id} /></Layout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/proposals" 
          element={user ? <Proposals /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/pipeline" // New route for Pipeline
          element={user ? <Pipeline /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" replace />} 
        />
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
        <CurrencyProvider> {/* Wrap with CurrencyProvider */}
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </CurrencyProvider>
      </GradientThemeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;