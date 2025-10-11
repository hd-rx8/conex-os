import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Users } from 'lucide-react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useSession } from '@/hooks/useSession';
import MainLayout from '@/components/MainLayout';
import CreateWorkspaceModal from '@/components/modals/CreateWorkspaceModal';
import EditWorkspaceModal from '@/components/modals/EditWorkspaceModal';
import DeleteConfirmDialog from '@/components/modals/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Workspace } from '@/types/hierarchy';

const WorkspaceSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const { workspaces, loading, updateWorkspace, deleteWorkspace, getWorkspaceTree } = useWorkspaces();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (data: {
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  }) => {
    if (!editingWorkspace) return;

    const { error } = await updateWorkspace(editingWorkspace.id, data);

    if (error) {
      toast.error('Erro ao atualizar workspace: ' + error.message);
      throw error;
    }

    toast.success('Workspace atualizado com sucesso!');
    setEditingWorkspace(null);
  };

  const handleDelete = async () => {
    if (!deletingWorkspace) return;

    setIsDeleting(true);

    const { error } = await deleteWorkspace(deletingWorkspace.id);

    if (error) {
      toast.error('Erro ao excluir workspace: ' + error.message);
      setIsDeleting(false);
      return;
    }

    toast.success('Workspace excluído com sucesso!');
    setDeletingWorkspace(null);
    setIsDeleting(false);
  };

  if (loading) {
    return (
      <MainLayout module="work">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p className="text-muted-foreground">Carregando workspaces...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/work')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Workspaces</h1>
              <p className="text-sm text-muted-foreground">
                Configure seus workspaces (setores) e organize seus projetos
              </p>
            </div>
          </div>

          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Workspace
          </Button>
        </div>

        <Separator />

        {/* Workspaces List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl"
                      style={{ backgroundColor: workspace.color || '#3B82F6' }}
                    >
                      {workspace.icon || '🏢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{workspace.name}</CardTitle>
                      {workspace.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {workspace.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{workspace.owner === user?.id ? 'Proprietário' : 'Membro'}</span>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingWorkspace(workspace)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeletingWorkspace(workspace)}
                      disabled={workspace.owner !== user?.id}
                      title={workspace.owner !== user?.id ? 'Apenas o proprietário pode excluir' : 'Excluir'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {workspaces.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <p className="text-lg font-medium">Nenhum workspace encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Crie seu primeiro workspace para começar a organizar seus projetos
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          toast.success('Workspace criado com sucesso!');
        }}
      />

      {editingWorkspace && (
        <EditWorkspaceModal
          isOpen={!!editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
          workspace={editingWorkspace}
          onUpdate={handleUpdate}
        />
      )}

      {deletingWorkspace && (
        <DeleteConfirmDialog
          isOpen={!!deletingWorkspace}
          onClose={() => setDeletingWorkspace(null)}
          onConfirm={handleDelete}
          title="Excluir Workspace"
          description="Tem certeza que deseja excluir este workspace? Esta ação não pode ser desfeita e todos os projetos, tarefas e dados dentro dele serão permanentemente excluídos."
          itemName={deletingWorkspace.name}
          isLoading={isDeleting}
        />
      )}
    </MainLayout>
  );
};

export default WorkspaceSettings;
