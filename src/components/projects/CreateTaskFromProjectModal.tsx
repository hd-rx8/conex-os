import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import type { CreateTaskData } from '@/types/hierarchy';
import { useSpaces } from '@/hooks/useSpaces';
import { useWorkspaceTreeQuery } from '@/features/work/hooks/useWorkData';
import { SelectGroup, SelectLabel } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  title: z.string().min(3, {
    message: 'O título da tarefa deve ter pelo menos 3 caracteres.',
  }),
  description: z.string().optional(),
  space_id: z.string().min(1, {
    message: 'Selecione um projeto.',
  }),
  list_id: z.string().min(1, {
    message: 'Selecione uma lista.',
  }),
  priority: z.enum(['Baixa', 'Média', 'Alta', 'Urgente']).default('Média'),
  due_date: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateTaskFromProjectModalProps {
  onCreateTask: (data: CreateTaskData) => Promise<void>;
  children?: React.ReactNode;
  preselectedSpaceId?: string;
  preselectedListId?: string;
  workspaceId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const CreateTaskFromProjectModal: React.FC<CreateTaskFromProjectModalProps> = ({
  onCreateTask,
  children,
  preselectedSpaceId,
  preselectedListId,
  workspaceId,
  isOpen: externalIsOpen,
  onClose: externalOnClose
}) => {
  const { user } = useSession();
  const treeQuery = useWorkspaceTreeQuery(workspaceId);
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = React.useState(preselectedSpaceId || '');

  // All spaces are now at the root since we removed workspace_folders
  const allSpaces = treeQuery.data?.spaces || [];

  const selectedSpace = allSpaces.find((s) => s.id === selectedSpaceId);

  // Use external control if provided, otherwise use internal state
  const open = externalIsOpen !== undefined ? externalIsOpen : internalOpen;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      space_id: preselectedSpaceId || '',
      list_id: preselectedListId || '',
      priority: 'Média',
      due_date: undefined,
    },
  });

  // Update form when preselected values change
  React.useEffect(() => {
    if (preselectedSpaceId) {
      form.setValue('space_id', preselectedSpaceId);
      setSelectedSpaceId(preselectedSpaceId);
    }
    if (preselectedListId) {
      form.setValue('list_id', preselectedListId);
    }
  }, [preselectedSpaceId, preselectedListId, form]);

  const handleSubmit = async (data: FormData) => {
    if (!user) {
      toast.error('Você precisa estar logado para criar uma tarefa.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalListId = data.list_id;
      
      // Auto-create list if needed
      if (finalListId === 'auto_create_list' && selectedSpace) {
        const { data: newList, error: listError } = await supabase.from('lists').insert({
          name: 'Geral',
          space_id: selectedSpace.id,
          workspace_id: selectedSpace.workspace_id,
          workspace_folder_id: selectedSpace.workspace_folder_id,
          icon: '📋',
          color: selectedSpace.color,
        }).select('id').single();
        
        if (listError) throw listError;
        finalListId = newList.id;
      }

      await onCreateTask({
        list_id: finalListId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null,
        creator_id: user.id,
        assignee_id: user.id, // Por padrão, atribui ao criador
        status: 'Pendente',
      });

      // Toast movido para o handleCreateTask
      form.reset();
      // Close modal using appropriate method
      if (externalOnClose) {
        externalOnClose();
      } else {
        setInternalOpen(false);
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (externalOnClose && !newOpen) {
      externalOnClose();
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Only render trigger if using internal control */}
      {externalIsOpen === undefined && children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para criar uma nova tarefa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="space_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto*</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedSpaceId(value);
                      form.setValue('list_id', ''); // Reset list when space changes
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {treeQuery.data?.spaces && treeQuery.data.spaces.length > 0 ? (
                        treeQuery.data.spaces.map((space) => (
                          <SelectItem key={space.id} value={space.id}>
                            <div className="flex items-center gap-2">
                              <span>{space.icon || '📁'}</span>
                              <span>{space.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum projeto encontrado.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="list_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lista*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedSpaceId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedSpaceId ? "Selecione uma lista" : "Selecione um projeto primeiro"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedSpace?.lists && selectedSpace.lists.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-muted-foreground font-semibold">Geral (Sem Pasta)</SelectLabel>
                          {selectedSpace.lists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {selectedSpace?.folders && selectedSpace.folders.map((folder) => (
                        <SelectGroup key={folder.id}>
                          <SelectLabel className="text-muted-foreground font-semibold flex items-center gap-2">
                            <span>{folder.icon || '📁'}</span>
                            {folder.name}
                          </SelectLabel>
                          {folder.lists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                      {(!selectedSpace || (selectedSpace.lists.length === 0 && selectedSpace.folders.length === 0)) && (
                        <SelectGroup>
                          <SelectLabel className="text-muted-foreground font-semibold">Geral (Nova Lista)</SelectLabel>
                          <SelectItem value="auto_create_list">
                            Criar lista "Geral"
                          </SelectItem>
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Tarefa*</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título da tarefa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a tarefa em detalhes"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Baixa">🟢 Baixa</SelectItem>
                      <SelectItem value="Média">🟡 Média</SelectItem>
                      <SelectItem value="Alta">🟠 Alta</SelectItem>
                      <SelectItem value="Urgente">🔴 Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="gradient-button-bg text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskFromProjectModal;
