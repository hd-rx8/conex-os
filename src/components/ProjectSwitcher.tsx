import React from 'react';
import { Check, ChevronsUpDown, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import useProjects from '@/hooks/useProjects';
import { useActiveProject } from '@/context/ActiveProjectContext';
import { useAppModule } from '@/context/AppModuleContext';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectSwitcher = () => {
  const [open, setOpen] = React.useState(false);
  const { projects, loading } = useProjects();
  const { activeProjectId, setActiveProjectId } = useActiveProject();
  const { activeModule } = useAppModule();

  // Only show in Work module
  if (activeModule !== 'work') {
    return null;
  }

  const activeProject = projects?.find(p => p.id === activeProjectId);
  const activeProjects = projects?.filter(p => p.status === 'Ativo') || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {loading ? (
            <Skeleton className="h-4 w-32" />
          ) : activeProject ? (
            <span className="truncate">{activeProject.title}</span>
          ) : (
            <span className="text-muted-foreground">Todos os projetos</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar projeto..." />
          <CommandList>
            <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
            <CommandGroup heading="Projetos Ativos">
              <CommandItem
                onSelect={() => {
                  setActiveProjectId(null);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !activeProjectId ? "opacity-100" : "opacity-0"
                  )}
                />
                Todos os projetos
              </CommandItem>
              {activeProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => {
                    setActiveProjectId(project.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeProjectId === project.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{project.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProjectSwitcher;
