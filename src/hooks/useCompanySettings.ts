import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/hooks/use-toast';

export interface CompanySettings {
  id?: string;
  user_id: string;
  company_name: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
}

export function useCompanySettings() {
  const { user } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companySettings, isLoading } = useQuery({
    queryKey: ['company_settings', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as CompanySettings | null;
    },
  });

  const saveCompanySettings = useMutation({
    mutationFn: async (values: Omit<CompanySettings, 'id' | 'user_id'>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const payload = { ...values, user_id: user.id };

      // upsert — insere se não existir, atualiza se já existir (baseado em user_id)
      const { data, error } = await supabase
        .from('company_settings')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', user?.id] });
      toast({
        title: 'Dados da empresa salvos!',
        description: 'As informações foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    companySettings,
    isLoading,
    saveCompanySettings,
  };
}
