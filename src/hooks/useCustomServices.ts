import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from './useSession';
import { Database } from '@/integrations/supabase/types'; // Import Database types

type BillingType = Database['public']['Enums']['billing_type'];

export interface CustomService {
  id: string;
  user_id: string;
  name: string;
  description: string;
  base_price: number;
  features: string[];
  category: string;
  icon: string;
  popular: boolean;
  created_at: string;
  updated_at: string;
  billing_type: BillingType; // Added billing_type
}

export interface CreateCustomServiceData {
  name: string;
  description: string;
  base_price: number;
  features: string[];
  category: string;
  icon?: string;
  popular?: boolean;
  billing_type: BillingType; // Added billing_type
}

export interface UpdateCustomServiceData {
  name?: string;
  description?: string;
  base_price?: number;
  features?: string[];
  category?: string;
  icon?: string;
  popular?: boolean;
  billing_type?: BillingType; // Added billing_type
}

export const useCustomServices = () => {
  const { user } = useSession();
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomServices = useCallback(async () => {
    if (!user?.id) {
      setCustomServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomServices(data || []);
    } catch (error) {
      console.error('Error fetching custom services:', error);
      toast.error('Erro ao carregar serviços personalizados');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createCustomService = async (serviceData: CreateCustomServiceData) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return { data: null, error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await supabase
        .from('custom_services')
        .insert({
          ...serviceData,
          user_id: user.id,
          icon: serviceData.icon || '✨', // Default icon if not provided
          popular: serviceData.popular || false, // Default popular if not provided
        })
        .select()
        .single();

      if (error) throw error;
      
      setCustomServices(prev => [data, ...prev]);
      toast.success('Serviço personalizado criado com sucesso!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating custom service:', error);
      toast.error('Erro ao criar serviço personalizado.');
      return { data: null, error };
    }
  };

  const updateCustomService = async (id: string, serviceData: UpdateCustomServiceData) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return { data: null, error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await supabase
        .from('custom_services')
        .update(serviceData)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own services
        .select()
        .single();

      if (error) throw error;
      
      setCustomServices(prev => prev.map(service => service.id === id ? data : service));
      toast.success('Serviço personalizado atualizado com sucesso!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating custom service:', error);
      toast.error('Erro ao atualizar serviço personalizado.');
      return { data: null, error };
    }
  };

  const deleteCustomService = async (id: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('custom_services')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own services

      if (error) throw error;
      
      setCustomServices(prev => prev.filter(service => service.id !== id));
      toast.success('Serviço personalizado excluído com sucesso!');
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting custom service:', error);
      toast.error('Erro ao excluir serviço personalizado.');
      return { error };
    }
  };

  useEffect(() => {
    fetchCustomServices();
  }, [fetchCustomServices]);

  return {
    customServices,
    loading,
    fetchCustomServices,
    createCustomService,
    updateCustomService,
    deleteCustomService,
  };
};