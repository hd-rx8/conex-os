import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Grid3x3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface AppOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const AppSwitcher = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const apps: AppOption[] = [
    {
      id: 'crm',
      name: 'CRM',
      description: 'Propostas e pipeline',
      icon: <div className="bg-teal-500 rounded-md p-4 text-white text-2xl flex items-center justify-center">P</div>,
      path: '/'
    },
    {
      id: 'work-management',
      name: 'work management',
      description: 'Projetos e tarefas',
      icon: <div className="bg-indigo-500 rounded-md p-4 text-white text-2xl flex items-center justify-center">G</div>,
      path: '/projects'
    },
  ];

  const handleSelectApp = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Grid3x3 className="h-5 w-5" />
          <span className="sr-only">Produtos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Produtos do Work OS</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 p-6">
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleSelectApp(app.path)}
              className="flex flex-col items-center p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
            >
              <div className="mb-3 w-16 h-16">{app.icon}</div>
              <div className="text-center">
                <p className="font-medium">{app.name}</p>
              </div>
            </div>
          ))}
          <div className="flex flex-col items-center p-3 rounded-md hover:bg-muted cursor-pointer transition-colors">
            <div className="mb-3 w-16 h-16">
              <div className="bg-gray-200 rounded-md p-4 text-gray-500 text-2xl flex items-center justify-center h-full">+</div>
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
