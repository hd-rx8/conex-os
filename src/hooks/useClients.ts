import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from './useSession';

export interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  created_at?: string; // Tornar opcional
  updated_at?: string; // Tornar opcional
  created_by?: string | null; // Tornar opcional
}

export interface CreateClientData {
  name: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
  created_by?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
}

export const useClients = () => {
  const { user } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = async (clientData: CreateClientData) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return { data: null, error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => [data, ...prev]);
      toast.success('Cliente criado com sucesso!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error('Erro ao criar cliente.');
      return { data: null, error };
    }
  };

  const updateClient = async (id: string, clientData: UpdateClientData) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return { data: null, error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => prev.map(client => client.id === id ? data : client));
      toast.success('Cliente atualizado com sucesso!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente.');
      return { data: null, error };
    }
  };

  const deleteClient = async (id: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClients(prev => prev.filter(client => client.id !== id));
      toast.success('Cliente excluído com sucesso!');
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente.');
      return { error };
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
};