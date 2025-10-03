import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Calculator, FileText, Users, Kanban, Menu, ClipboardList } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import UserNav from './UserNav';
import { ThemeToggle } from './ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import AppSwitcher from './AppSwitcher'; // Importar o novo componente
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  module?: 'crm' | 'projects'; // Novo parâmetro para identificar o módulo atual
}

const Layout = ({ children, module = 'crm' }: LayoutProps) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  // Links de navegação específicos para o módulo CRM
  const crmNavLinks = (
    <>
      <Button
        variant={isActive('/') ? 'default' : 'ghost'}
        onClick={() => handleNavigation('/')}
        className="flex items-center gap-2 w-full justify-start"
      >
        <LayoutDashboard className="w-4 h-4" />
        Dashboard
      </Button>
      <Button
        variant={isActive('/generator') ? 'default' : 'ghost'}
        onClick={() => handleNavigation('/generator')}
        className="flex items-center gap-2 w-full justify-start"
      >
        <Calculator className="w-4 h-4" />
        Gerador de Propostas
      </Button>
      <Button
        variant={isActive('/proposals') ? 'default' : 'ghost'}
        onClick={() => handleNavigation('/proposals')}
        className="flex items-center gap-2 w-full justify-start"
      >
        <FileText className="w-4 h-4" />
        Propostas
      </Button>
      <Button
        variant={isActive('/pipeline') ? 'default' : 'ghost'}
        onClick={() => handleNavigation('/pipeline')}
        className="flex items-center gap-2 w-full justify-start"
      >
        <Kanban className="w-4 h-4" />
        Oportunidades
      </Button>
      <Button
        variant={isActive('/clients') ? 'default' : 'ghost'}
        onClick={() => handleNavigation('/clients')}
        className="flex items-center gap-2 w-full justify-start"
      >
        <Users className="w-4 h-4" />
        Clientes
      </Button>
    </>
  );

  // Links de navegação específicos para o módulo de Projetos
  const projectsNavLinks = (
    <>
      <Button
        variant={isActive('/projects') ? 'default' : 'ghost'}
        onClick={() => handleNavigation('/projects')}
        className="flex items-center gap-2 w-full justify-start"
      >
        <LayoutDashboard className="w-4 h-4" />
        Dashboard
      </Button>
      <Button
        variant={isActive('/projects/tasks') ? 'default' : 'ghost'}
        onClick={() => handleNavigation('/projects/tasks')}
        className="flex items-center gap-2 w-full justify-start"
      >
        <ClipboardList className="w-4 h-4" />
        Minhas Tarefas
      </Button>
      <Button
        variant={isActive('/projects/board') ? 'default' : 'ghost'}
        onClick={() => handleNavigation('/projects/board')}
        className="flex items-center gap-2 w-full justify-start"
      >
        <Kanban className="w-4 h-4" />
        Quadro Kanban
      </Button>
    </>
  );

  // Seleciona os links de navegação com base no módulo atual
  const navLinks = module === 'crm' ? crmNavLinks : projectsNavLinks;

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <div className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isMobile && (
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle className="gradient-text">Navegação</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 space-y-2">
                      {navLinks}
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold gradient-text">CONEX.HUB</h1>
                <AppSwitcher /> {/* Adicionar o AppSwitcher aqui */}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Desktop Navigation Buttons */}
              {!isMobile && (
                <div className="flex gap-2">
                  {navLinks}
                </div>
              )}

              {/* User Info Dropdown and Theme Toggle */}
              <div className="flex items-center gap-2 pl-4 border-l">
                <UserNav 
                  userName={user?.user_metadata?.full_name} 
                  userEmail={user?.email} 
                  avatarUrl={user?.user_metadata?.avatar_url}
                />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-20">
        {children}
      </div>
    </div>
  );
};

export default Layout;