import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AppUser {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
}

export interface CreateUserData {
  name: string;
  email?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      // Generate a random UUID for the user
      const userId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          id: userId,
          name: userData.name,
          email: userData.email || null
        })
        .select()
        .single();

      if (error) throw error;
      
      setUsers(prev => [data, ...prev]);
      toast.success('Usuário criado com sucesso');
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
      return { data: null, error };
    }
  };

  const updateUser = async (id: string, userData: UpdateUserData) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setUsers(prev => prev.map(user => user.id === id ? data : user));
      toast.success('Usuário atualizado com sucesso');
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
      return { data: null, error };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setUsers(prev => prev.filter(user => user.id !== id));
      toast.success('Usuário excluído com sucesso');
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
      return { error };
    }
  };

  // Filter and pagination logic
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users: paginatedUsers,
    allUsers: users,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredUsers.length,
    itemsPerPage,
    createUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers
  };
};