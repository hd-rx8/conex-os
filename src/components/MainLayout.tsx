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
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, module }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // Load sidebar state from localStorage on desktop
  useEffect(() => {
    if (!isMobile) {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        setSidebarCollapsed(JSON.parse(saved));
      }
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    
    // Save state to localStorage for desktop
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background">
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
          "flex flex-col h-full transition-all duration-300 ease-in-out",
          // Desktop margins
          !isMobile && !sidebarCollapsed && "md:ml-64",
          !isMobile && sidebarCollapsed && "md:ml-16",
          // Mobile full width
          isMobile && "ml-0"
        )}
      >
        {/* Desktop header with app switcher and theme toggle */}
        <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-30">
          {/* Mobile menu toggle and logo */}
          <div className="flex items-center gap-2">
            {isMobile && <MobileMenuToggle onToggle={toggleSidebar} />}
            <h1 className="text-lg font-bold gradient-text">CONEX.HUB</h1>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center gap-3">
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
        <main className="flex-1 overflow-auto">
          <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
            <div className="mx-auto max-w-none xl:max-w-[1400px] 2xl:max-w-[1600px]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Global Contextual FAB */}
      <GlobalFAB />
    </div>
  );
};

export default MainLayout;
