import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  FileText,
  Users,
  Kanban,
  Settings,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  Folder
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppModule, AppModuleType } from '@/context/AppModuleContext';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useSpaces } from '@/hooks/useSpaces';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import UserNav from './UserNav';
import SettingsButton from './SettingsButton';
import WorkspaceSelector from './WorkspaceSelector';
import SpacesTreeNav from './SpacesTreeNav';
import CreateProjectModal from './modals/CreateProjectModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { WorkspaceTree } from '@/types/hierarchy';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path?: string;
  children?: NavigationItem[];
}

interface NavigationSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Definição dos itens de navegação para o módulo CRM
const NAV_CRM: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/'
  },
  {
    id: 'generator',
    label: 'Gerador de Propostas',
    icon: Calculator,
    path: '/generator'
  },
  {
    id: 'opportunities',
    label: 'Oportunidades',
    icon: Kanban,
    path: '/opportunities'
  },
  {
    id: 'clients',
    label: 'Clientes',
    icon: Users,
    path: '/clients'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    path: '/settings'
  }
];

// Definição dos itens de navegação para o módulo Work Management
const NAV_WORK: NavigationItem[] = [
  {
    id: 'projects-overview',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/projects'
  },
  {
    id: 'workspaces',
    label: 'Gerenciar Workspaces',
    icon: FolderOpen,
    path: '/work/workspaces'
  },
  {
    id: 'my-tasks',
    label: 'Minhas Tarefas',
    icon: ClipboardList,
    path: '/projects/tasks'
  },
  {
    id: 'tasks-board',
    label: 'Quadro Kanban',
    icon: Kanban,
    path: '/projects/board'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    path: '/settings'
  }
];

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  isCollapsed,
  onToggleCollapse
}) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { activeModule } = useAppModule();
  const { workspaces, getWorkspaceTree } = useWorkspaces();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaceTree, setWorkspaceTree] = useState<WorkspaceTree | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const { createSpace } = useSpaces(selectedWorkspaceId || undefined);

  // Seleciona os itens de navegação com base no módulo ativo
  const navigationItems = useMemo(() => {
    if (activeModule === 'crm') {
      return NAV_CRM;
    }
    return NAV_WORK;
  }, [activeModule]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([])
  );

  // Carregar primeiro workspace por padrão
  useEffect(() => {
    if (activeModule === 'work' && workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId, activeModule]);

  // Carregar árvore do workspace selecionado
  useEffect(() => {
    const loadTree = async () => {
      if (selectedWorkspaceId && activeModule === 'work') {
        const tree = await getWorkspaceTree(selectedWorkspaceId);
        setWorkspaceTree(tree);
      }
    };
    loadTree();
  }, [selectedWorkspaceId, activeModule, getWorkspaceTree]);

  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setSelectedListId(null);
  };

  const handleSpaceSelect = (spaceId: string) => {
    navigate(`/work/project/${spaceId}`);
  };

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    navigate(`/work/list/${listId}`);
  };

  const handleCreateProject = async (data: {
    workspace_id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  }) => {
    const { error } = await createSpace(data);

    if (error) {
      toast.error('Erro ao criar projeto: ' + error.message);
      throw error;
    }

    toast.success('Projeto criado com sucesso!');

    // Recarregar workspace tree
    if (selectedWorkspaceId) {
      const tree = await getWorkspaceTree(selectedWorkspaceId);
      setWorkspaceTree(tree);
    }
  };

  const isActive = (path?: string, children?: NavigationItem[]) => {
    if (!path && children) {
      return children.some(child => isActive(child.path));
    }
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && path && location.pathname.startsWith(path)) return true;
    return false;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.has(item.id);
    const itemIsActive = isActive(item.path, item.children);
    const Icon = item.icon;

    const buttonContent = (
      <>
        <Icon className={cn("h-4 w-4 shrink-0", isCollapsed && "h-5 w-5")} />
        {!isCollapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {hasChildren && (
              <div className="ml-auto">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
            )}
          </>
        )}
      </>
    );

    return (
      <div key={item.id} className="w-full">
        {isCollapsed && !isMobile ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (hasChildren) {
                      toggleSection(item.id);
                    } else if (item.path) {
                      handleNavigation(item.path);
                    }
                  }}
                  className={cn(
                    "w-full justify-center h-10 px-2 font-normal transition-all duration-200",
                    itemIsActive && !hasChildren && "bg-primary text-primary-foreground hover:bg-primary/90",
                    itemIsActive && hasChildren && "bg-accent text-accent-foreground",
                    !itemIsActive && "hover:bg-accent hover:text-accent-foreground"
                  )}
                  aria-label={item.label}
                >
                  {buttonContent}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            onClick={() => {
              if (hasChildren) {
                toggleSection(item.id);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            className={cn(
              "w-full justify-start gap-3 h-10 px-3 font-normal transition-all duration-200",
              level > 0 && "ml-4 h-8 text-sm",
              itemIsActive && !hasChildren && "bg-primary text-primary-foreground hover:bg-primary/90",
              itemIsActive && hasChildren && "bg-accent text-accent-foreground",
              isCollapsed && "justify-center px-2",
              !itemIsActive && "hover:bg-accent hover:text-accent-foreground"
            )}
            aria-label={item.label}
          >
            {buttonContent}
          </Button>
        )}

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-2 mt-1 space-y-1">
            {item.children?.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-background border-r transform transition-transform duration-300 ease-in-out",
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CONEX.HUB" className="h-8 w-auto" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4" aria-label="Navegação principal">
          <div className="space-y-1">
            {navigationItems.map(item => renderNavigationItem(item))}
          </div>

          {/* Workspace Selector + Spaces Tree (Work Module Only) */}
          {activeModule === 'work' && workspaces.length > 0 && (
            <>
              <Separator className="my-4" />

              <div className="space-y-3">
                <WorkspaceSelector
                  workspaces={workspaces}
                  selectedWorkspaceId={selectedWorkspaceId || undefined}
                  onSelect={handleWorkspaceChange}
                  onCreateProject={() => setIsCreateProjectOpen(true)}
                  isCollapsed={false}
                />

                {workspaceTree && (
                  <div className="space-y-1">
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Projetos
                      </h3>
                    </div>
                    <SpacesTreeNav
                      spaces={workspaceTree.spaces}
                      onSelectSpace={handleSpaceSelect}
                      selectedListId={selectedListId || undefined}
                      onSelectList={handleListSelect}
                      isCollapsed={false}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        {/* Mobile Footer */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <UserNav
              userName={user?.user_metadata?.full_name}
              userEmail={user?.email}
              avatarUrl={user?.user_metadata?.avatar_url}
            />
            <SettingsButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40 md:bg-background md:border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-16" : "md:w-64"
      )}
    >
      {/* Desktop Header */}
      <div className={cn(
        "flex border-b p-3",
        isCollapsed ? "flex-col items-center gap-2" : "flex-row items-center justify-between px-4 py-3"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-center">
          <img
            src="/logo.png"
            alt="CONEX.HUB"
            className={cn(
              "object-contain transition-all duration-300",
              isCollapsed ? "h-7 w-7" : "h-8 w-auto"
            )}
          />
        </div>

        {/* Toggle Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className={cn("h-8 w-8 shrink-0", !isCollapsed && "ml-auto")}
                aria-label="Colapsar menu"
              >
                {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expandir menu" : "Colapsar menu"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>


      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4" aria-label="Navegação principal">
        <div className="space-y-1">
          {navigationItems.map(item => renderNavigationItem(item))}
        </div>

        {/* Workspace Selector + Spaces Tree (Work Module Only) */}
        {activeModule === 'work' && workspaces.length > 0 && (
          <>
            <Separator className="my-4" />

            {!isCollapsed && (
              <div className="space-y-3">
                <WorkspaceSelector
                  workspaces={workspaces}
                  selectedWorkspaceId={selectedWorkspaceId || undefined}
                  onSelect={handleWorkspaceChange}
                  onCreateProject={() => setIsCreateProjectOpen(true)}
                  isCollapsed={isCollapsed}
                />

                {workspaceTree && (
                  <div className="space-y-1">
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Projetos
                      </h3>
                    </div>
                    <SpacesTreeNav
                      spaces={workspaceTree.spaces}
                      onSelectSpace={handleSpaceSelect}
                      selectedListId={selectedListId || undefined}
                      onSelectList={handleListSelect}
                      isCollapsed={isCollapsed}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Desktop Footer */}
      <div className="border-t p-4">
        <div className={cn(
          "flex items-center gap-2",
          isCollapsed && "justify-center"
        )}>
          <UserNav 
            userName={user?.user_metadata?.full_name} 
            userEmail={user?.email} 
            avatarUrl={user?.user_metadata?.avatar_url}
            collapsed={isCollapsed}
          />
          {!isCollapsed && <SettingsButton />}
        </div>
      </div>

      {/* Create Project Modal */}
      {selectedWorkspaceId && (
        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          workspaceId={selectedWorkspaceId}
          onCreateProject={handleCreateProject}
        />
      )}
    </div>
  );
};

export default NavigationSidebar;