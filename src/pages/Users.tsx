import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUsers, AppUser, CreateUserData, UpdateUserData } from '@/hooks/useUsers';
import { useSession } from '@/hooks/useSession';
import { UserPlus, Search, Edit, Trash2, Users as UsersIcon, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import MainLayout from '@/components/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import FloatingActionButton from '@/components/FloatingActionButton';
import { useAppModule } from '@/context/AppModuleContext';

interface UserFormData {
  name: string;
  email: string;
}

const UserForm = ({ 
  user, 
  onSubmit, 
  onCancel 
}: { 
  user?: AppUser; 
  onSubmit: (data: CreateUserData | UpdateUserData) => void; 
  onCancel: () => void;
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UserFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  const onFormSubmit = (data: UserFormData) => {
    onSubmit({
      name: data.name,
      email: data.email || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nome *</label>
        <Input
          {...register('name', { required: 'Nome é obrigatório' })}
          placeholder="Digite o nome do usuário"
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium">E-mail</label>
        <Input
          {...register('email', {
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'E-mail inválido'
            }
          })}
          type="email"
          placeholder="Digite o e-mail (opcional)"
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {user ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};

const UserSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
  </TableRow>
);

export default function Users() {
  const { user: currentUser } = useSession();
  const { activeModule } = useAppModule();
  const {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    createUser,
    updateUser,
    deleteUser
  } = useUsers();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const handleCreateUser = async (data: CreateUserData) => {
    const result = await createUser(data);
    if (result.data) {
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateUser = async (data: UpdateUserData) => {
    if (!editingUser) return;
    
    const result = await updateUser(editingUser.id, data);
    if (result.data) {
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (user.id === currentUser?.id) {
      toast.error('Você não pode excluir seu próprio perfil');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      await deleteUser(user.id);
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    if (!userEmail) {
      toast.error('E-mail do usuário não encontrado.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(`Erro ao enviar e-mail de redefinição para ${userEmail}: ${error.message}`);
      } else {
        toast.success(`E-mail de redefinição enviado para ${userEmail}.`);
      }
    } catch (err) {
      console.error('Error sending password reset email:', err);
      toast.error('Erro ao solicitar redefinição de senha.');
    }
  };

  return (
    <MainLayout module={activeModule}>
      <div className="space-y-6 relative pb-20">
        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={() => setIsCreateDialogOpen(true)}
          tooltip="Criar Novo Usuário"
          icon={UserPlus}
        />
        
        {/* Dialog moved outside FAB */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <UserForm 
              onSubmit={handleCreateUser}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Badge variant="secondary">
                {totalItems} usuário{totalItems !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <UserSkeleton key={i} />
                    ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="ml-2">Você</Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {user.id === currentUser?.id && user.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetPassword(user.email!)}
                                title="Redefinir sua senha"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <UserForm 
                user={editingUser}
                onSubmit={handleUpdateUser}
                onCancel={() => setEditingUser(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}