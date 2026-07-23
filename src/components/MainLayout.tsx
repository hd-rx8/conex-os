import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NavigationSidebar from './NavigationSidebar';
import MobileMenuToggle from './MobileMenuToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppModule } from '@/context/AppModuleContext';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import AppSwitcher from './AppSwitcher';
import UserNav from './UserNav';
import { useSession } from '@/hooks/useSession';
import GlobalFAB from './GlobalFAB';

interface MainLayoutProps {
  children: React.ReactNode;
  module?: 'crm' | 'work';
  showGlobalFab?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  module,
  showGlobalFab = true,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const isMobile = useIsMobile();
  const location = useLocation();
  const { activeModule, setActiveModule } = useAppModule();
  const { user } = useSession();
  
  // Atualizar o módulo ativo se for fornecido como prop
  useEffect(() => {
    if (module && module !== activeModule) {
      setActiveModule(module);
    }
  }, [module, activeModule, setActiveModule]);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    
    // Save state to localStorage for desktop
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-muted/20">
      {/* Sidebar */}
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Mobile overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main content */}
      <div
        className={cn(
          "flex h-full min-w-0 flex-col transition-all duration-300 ease-in-out",
          // Desktop margins
          !isMobile && !sidebarCollapsed && "md:ml-64",
          !isMobile && sidebarCollapsed && "md:ml-16",
          // Mobile full width
          isMobile && "ml-0"
        )}
      >
        {/* Desktop header with app switcher and theme toggle */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          {/* Mobile menu toggle and logo */}
          <div className="flex min-w-0 items-center gap-3">
            {isMobile && <MobileMenuToggle onToggle={toggleSidebar} />}
            <h1 className="truncate text-lg font-bold gradient-text">CONEX.HUB</h1>
          </div>
          
          {/* Right side controls */}
          <div className="flex shrink-0 items-center gap-2">
            <AppSwitcher />
            <ThemeToggle />
            {isMobile && (
              <UserNav
                userName={user?.user_metadata?.full_name}
                userEmail={user?.email}
                avatarUrl={user?.user_metadata?.avatar_url}
              />
            )}
          </div>
        </header>

        {/* Content area */}
        <main className="min-w-0 flex-1 overflow-auto">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Global Contextual FAB */}
      {showGlobalFab && <GlobalFAB />}
    </div>
  );
};

export default MainLayout;
