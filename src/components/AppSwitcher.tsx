import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppWindow, ArrowLeftRight, LayoutDashboard, FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useAppModule, AppModuleType } from '@/context/AppModuleContext';

interface AppOption {
  id: AppModuleType;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  letter: string;
}

const AppSwitcher = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { activeModule, switchToModule } = useAppModule();

  const apps: AppOption[] = [
    {
      id: 'crm',
      name: 'CRM',
      description: 'Propostas e pipeline',
      icon: <div className="bg-teal-500 rounded-md p-4 text-white text-2xl flex items-center justify-center h-full">P</div>,
      path: '/',
      color: 'bg-teal-500',
      letter: 'P'
    },
    {
      id: 'work',
      name: 'Work Management',
      description: 'Projetos e tarefas',
      icon: <div className="bg-indigo-500 rounded-md p-4 text-white text-2xl flex items-center justify-center h-full">G</div>,
      path: '/projects',
      color: 'bg-indigo-500',
      letter: 'G'
    },
  ];

  const handleSelectApp = (moduleId: AppModuleType, path: string) => {
    switchToModule(moduleId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                aria-label="Trocar módulo"
              >
                <ArrowLeftRight className="h-5 w-5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Trocar módulo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CONEX.HUB" className="h-7 w-auto" />
            <DialogTitle>Produtos do Work OS</DialogTitle>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 p-6">
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleSelectApp(app.id, app.path)}
              className={`flex flex-col items-center p-3 rounded-md hover:bg-muted cursor-pointer transition-colors ${activeModule === app.id ? 'bg-muted' : ''}`}
            >
              <div className="mb-3 w-16 h-16">
                <div className={`${app.color} rounded-md p-4 text-white text-2xl flex items-center justify-center h-full`}>
                  {app.id === 'crm' ? <LayoutDashboard className="h-6 w-6" /> : <FolderOpen className="h-6 w-6" />}
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium">{app.name}</p>
                <p className="text-xs text-muted-foreground">{app.description}</p>
              </div>
            </div>
          ))}
          <div className="flex flex-col items-center p-3 rounded-md opacity-60 cursor-not-allowed">
            <div className="mb-3 w-16 h-16">
              <div className="bg-gray-200 rounded-md p-4 text-gray-500 text-2xl flex items-center justify-center h-full">
                <AppWindow className="h-6 w-6" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium">Descobrir</p>
              <p className="text-xs text-muted-foreground">produtos</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppSwitcher;