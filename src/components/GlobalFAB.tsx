import React from 'react';
import ContextualFAB from './ContextualFAB';
import { useFABActions } from '@/hooks/useFABActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import CreateTaskFromProjectModal from '@/components/projects/CreateTaskFromProjectModal';
import useProjects from '@/hooks/useProjects';

// Schema para validação de cliente
const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  company: z.string().optional(),
  phone: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

// Schema para validação de proposta
const proposalSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  client_id: z.string().nullable(),
  owner: z.string().min(1, 'Responsável é obrigatório')
});

type ProposalFormData = z.infer<typeof proposalSchema>;

// Componente de formulário de cliente
const ClientForm = ({
  onSubmit,
  onCancel,
  isSubmitting
}: {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema)
  });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted, { shouldValidate: true });
  };

  const onFormSubmit = async (data: ClientFormData) => {
    await onSubmit({
      name: data.name,
      email: data.email || null,
      company: data.company || null,
      phone: data.phone || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nome do Cliente *</label>
        <Input {...register('name')} placeholder="Digite o nome completo do cliente" />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">E-mail</label>
        <Input {...register('email')} type="email" placeholder="cliente@email.com" />
        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Empresa</label>
        <Input {...register('company')} placeholder="Nome da empresa (opcional)" />
      </div>

      <div>
        <label className="text-sm font-medium">Telefone</label>
        <Input {...register('phone')} onChange={handlePhoneChange} placeholder="(XX) X XXXX-XXXX" maxLength={16} />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>Criar Cliente</Button>
      </div>
    </form>
  );
};

// Componente de formulário de proposta
const ProposalForm = ({
  onSubmit,
  onCancel,
  currentUserId,
  allUsers,
  allClients,
  isSubmitting
}: {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  currentUserId: string;
  allUsers: any[];
  allClients: any[];
  isSubmitting: boolean;
}) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      owner: currentUserId,
      client_id: null
    }
  });

  const onFormSubmit = async (data: ProposalFormData) => {
    await onSubmit({
      title: data.title,
      amount: Number(data.amount),
      client_id: data.client_id || null,
      owner: data.owner
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Título *</label>
        <Input {...register('title')} placeholder="Digite o título da proposta" />
        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Valor *</label>
        <Input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" />
        {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Cliente</label>
        <Select value={watch('client_id') || ''} onValueChange={(value) => setValue('client_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {allClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.email ? `(${client.email})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Responsável *</label>
        <Select value={watch('owner')} onValueChange={(value) => setValue('owner', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o responsável" />
          </SelectTrigger>
          <SelectContent>
            {allUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.owner && <p className="text-sm text-destructive mt-1">{errors.owner.message}</p>}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>Criar Proposta</Button>
      </div>
    </form>
  );
};

/**
 * Componente Global FAB - Gerencia o FAB contextual e todos os modais de criação
 * Este componente deve ser incluído no MainLayout para estar disponível globalmente
 */
const GlobalFAB: React.FC = () => {
  const { actions, modals, data } = useFABActions();
  const { projects } = useProjects();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleClientSubmit = async (clientData: any) => {
    setIsSubmitting(true);
    try {
      const result = await modals.client.onSubmit(clientData);
      if (result.data) {
        toast.success('Cliente criado com sucesso!');
      } else if (result.error) {
        toast.error(result.error.message || 'Erro ao criar cliente');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProposalSubmit = async (proposalData: any) => {
    setIsSubmitting(true);
    try {
      const result = await modals.proposal.onSubmit(proposalData);
      if (result.data) {
        toast.success('Proposta criada com sucesso!');
      } else if (result.error) {
        toast.error(result.error.message || 'Erro ao criar proposta');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar proposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectSubmit = async (projectData: any) => {
    setIsSubmitting(true);
    try {
      await modals.project.onSubmit(projectData);
      toast.success('Projeto criado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar projeto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskSubmit = async (taskData: any) => {
    setIsSubmitting(true);
    try {
      await modals.task.onSubmit(taskData);
      toast.success('Tarefa criada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <ContextualFAB actions={actions} />

      {/* Client Modal */}
      <Dialog open={modals.client.isOpen} onOpenChange={modals.client.setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSubmit={handleClientSubmit}
            onCancel={() => modals.client.setIsOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Proposal Modal */}
      <Dialog open={modals.proposal.isOpen} onOpenChange={modals.proposal.setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Proposta</DialogTitle>
          </DialogHeader>
          <ProposalForm
            onSubmit={handleProposalSubmit}
            onCancel={() => modals.proposal.setIsOpen(false)}
            currentUserId={data.currentUser?.id || ''}
            allUsers={data.allUsers}
            allClients={data.clients}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Project Modal */}
      <CreateProjectModal
        isOpen={modals.project.isOpen}
        onClose={() => modals.project.setIsOpen(false)}
        onCreateProject={handleProjectSubmit}
      />

      {/* Task Modal */}
      <CreateTaskFromProjectModal
        projects={projects || []}
        onCreateTask={handleTaskSubmit}
        preselectedProjectId={modals.task.projectId}
        isOpen={modals.task.isOpen}
        onClose={() => modals.task.setIsOpen(false)}
      />
    </>
  );
};

export default GlobalFAB;
