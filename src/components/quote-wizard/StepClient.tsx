import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useQuoteWizard } from '@/context/QuoteWizardContext';
import { Client } from '@/hooks/useClients';
import { Check, ChevronsUpDown, Building, Mail, Phone, User as UserIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client for duplicate check
import { useSession } from '@/hooks/useSession'; // Import useSession to get current user ID

// Zod schema for new client form validation
const newClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').trim(),
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório').toLowerCase().trim(),
  company: z.string().optional().transform(e => e === "" ? undefined : e?.trim()),
  phone: z.string().optional().transform(p => p === "" ? undefined : p?.trim()),
});

type NewClientFormData = z.infer<typeof newClientSchema>;

const StepClient: React.FC = () => {
  const { user } = useSession(); // Get current user for RLS
  const {
    clientInfo, setClientInfo,
    existingClients, fetchExistingClients,
    selectedClientId, setSelectedClientId,
    isNewClient, setIsNewClient,
    createClient, // Get createClient from context
    goToNextStep, // Get goToNextStep from context
  } = useQuoteWizard();

  // DEBUG: Log the entire context object to see what's actually being received
  console.log('DEBUG: Full QuoteWizardContext in StepClient:', useQuoteWizard());
  console.log('DEBUG: createClient in StepClient (direct):', createClient);

  const [openCombobox, setOpenCombobox] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null);

  const { register, handleSubmit, setValue, reset, getValues, formState: { errors, isSubmitting } } = useForm<NewClientFormData>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      phone: '',
    },
  });

  useEffect(() => {
    fetchExistingClients();
  }, [fetchExistingClients]);

  useEffect(() => {
    reset({ name: '', email: '', company: '', phone: '' });
  }, [isNewClient, reset]);

  // Update clientInfo when selectedClientId changes (for existing client mode)
  useEffect(() => {
    if (!isNewClient && selectedClientId) {
      const client = existingClients.find(c => c.id === selectedClientId);
      if (client) {
        setClientInfo({
          id: client.id,
          name: client.name,
          email: client.email || '',
          company: client.company || '',
          phone: client.phone || ''
        });
      }
    } else if (!selectedClientId && !isNewClient) {
      // Clear clientInfo if no client is selected in existing mode
      setClientInfo({ name: '', email: '', company: '', phone: '' });
    }
  }, [isNewClient, selectedClientId, existingClients, setClientInfo]);


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

  const handleNewClientSubmit = async (data: NewClientFormData) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para criar um cliente.');
      return;
    }

    // 1. Check for duplicate client by email
    try {
      const { data: existingClientsWithEmail, error: fetchError } = await supabase
        .from('clients')
        .select('id, name, email, company, phone, created_at, updated_at, created_by') // Selecionar todas as colunas para corresponder à interface Client
        .ilike('email', data.email)
        .eq('created_by', user.id); // Ensure RLS is respected

      if (fetchError) throw fetchError;

      if (existingClientsWithEmail && existingClientsWithEmail.length > 0) {
        setDuplicateClient(existingClientsWithEmail[0]); // Agora o tipo corresponde
        setIsDuplicateDialogOpen(true);
        return; // Stop submission, wait for user decision
      }
    } catch (error: any) {
      console.error('Error checking for duplicate client:', error);
      toast.error(`Erro ao verificar cliente existente: ${error.message}`);
      return;
    }

    // 2. If no duplicate, proceed with creation
    await createAndSelectClient(data);
  };

  const createAndSelectClient = async (data: NewClientFormData) => {
    // Removed the defensive check to allow the error to surface at the call site if it's still undefined
    // if (typeof createClient !== 'function') {
    //   console.error('ERROR: createClient is not a function in StepClient.tsx!');
    //   toast.error('Erro interno: A função de criação de cliente não está disponível.');
    //   return; // Exit early to prevent further errors
    // }

    const result = await createClient({
      name: data.name,
      email: data.email,
      company: data.company || null,
      phone: data.phone || null,
    });

    if (result.data) {
      await fetchExistingClients(); // Ensure the list is updated
      setSelectedClientId(result.data.id);
      setIsNewClient(false); // Switch back to existing client mode
      toast.success('Novo cliente criado e selecionado!');
      goToNextStep(); // Advance to the next step (Review)
    } else if (result.error) {
      toast.error(`Erro ao criar cliente: ${result.error.message}`);
    }
  };

  const handleUseExistingClient = () => {
    if (duplicateClient) {
      setSelectedClientId(duplicateClient.id);
      setIsNewClient(false); // Switch back to existing client mode
      toast.success(`Cliente "${duplicateClient.name}" selecionado!`);
      goToNextStep(); // Advance to the next step (Review)
    }
    setIsDuplicateDialogOpen(false);
    setDuplicateClient(null);
  };

  const handleCreateAnyway = async () => {
    setIsDuplicateDialogOpen(false);
    setDuplicateClient(null);
    // Proceed with creation, ignoring the duplicate check (user's choice)
    const formData = getValues(); // Use the getValues from useForm directly
    await createAndSelectClient(formData);
  };

  const handleSelectExistingClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setOpenCombobox(false);
    // Automatically advance to the next step if a client is selected
    goToNextStep();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>Selecione um cliente existente ou crie um novo para esta proposta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isNewClient && (
            <div className="space-y-2">
              <Label htmlFor="existing-client">Selecionar Cliente Existente *</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    {selectedClientId
                      ? existingClients.find((client) => client.id === selectedClientId)?.name
                      : "Selecione um cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {existingClients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => handleSelectExistingClient(client.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClientId === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {client.name} {client.email ? `(${client.email})` : ''}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="new-client-toggle"
              checked={isNewClient}
              onCheckedChange={(checked) => {
                setIsNewClient(checked);
              }}
            />
            <Label htmlFor="new-client-toggle">Criar Novo Cliente</Label>
          </div>

          {isNewClient ? (
            <form onSubmit={handleSubmit(handleNewClientSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-name">Nome Completo *</Label>
                  <Input
                    id="new-name"
                    {...register('name')}
                    placeholder="João Silva"
                    required
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="new-company">Empresa</Label>
                  <Input
                    id="new-company"
                    {...register('company')}
                    placeholder="Minha Empresa Ltda"
                  />
                  {errors.company && <p className="text-sm text-destructive mt-1">{errors.company.message}</p>}
                </div>
                <div>
                  <Label htmlFor="new-phone">Telefone</Label>
                  <Input
                    id="new-phone"
                    {...register('phone')}
                    onChange={handlePhoneChange}
                    placeholder="(11) 9 9999-9999"
                    maxLength={16}
                  />
                  {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="new-email">E-mail *</Label>
                  <Input
                    id="new-email"
                    type="email"
                    {...register('email')}
                    placeholder="joao@empresa.com"
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Criando Cliente...' : 'Salvar Novo Cliente'}
              </Button>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={clientInfo.name}
                  placeholder="João Silva"
                  required
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={clientInfo.company}
                  placeholder="Minha Empresa Ltda"
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={clientInfo.phone}
                  placeholder="(11) 9 9999-9999"
                  maxLength={16}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientInfo.email}
                  placeholder="joao@empresa.com"
                  required
                  disabled
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Client Dialog */}
      <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cliente Existente Detectado!</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um cliente com o e-mail "{duplicateClient?.email}" e nome "{duplicateClient?.name}".
              Deseja usar este cliente existente para a proposta ou criar um novo mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDuplicateDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={handleCreateAnyway}>
              Criar Novo Mesmo Assim
            </Button>
            <AlertDialogAction onClick={handleUseExistingClient}>
              Usar Cliente Existente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StepClient;