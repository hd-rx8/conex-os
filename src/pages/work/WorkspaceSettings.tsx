import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Users } from 'lucide-react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useSession } from '@/hooks/useSession';
import MainLayout from '@/components/MainLayout';
import CreateWorkspaceModal from '@/components/modals/CreateWorkspaceModal';
import EditWorkspaceModal from '@/components/modals/EditWorkspaceModal';
import DeleteConfirmDialog from '@/components/modals/DeleteConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  WorkEmptyState,
  WorkLoadingState,
} from '@/features/work/components/WorkStates';
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
        <div className="app-page">
          <PageHeader
            eyebrow="Work Management"
            title="Workspaces"
            description="Configure setores, equipes e a estrutura dos seus projetos."
          />
          <WorkLoadingState label="Carregando workspaces…" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work">
      <div className="app-page">
        <PageHeader
          eyebrow="Work Management"
          title="Workspaces"
          description="Configure setores, equipes e a estrutura dos seus projetos."
          breadcrumbs={
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 w-fit text-muted-foreground"
              onClick={() => navigate('/work')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a visão geral
            </Button>
          }
          actions={
            <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Workspace
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className="cursor-pointer overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => navigate(`/work/workspaces/${workspace.id}`)}
            >
              <CardHeader className="pb-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm"
                      style={{ backgroundColor: workspace.color || '#3B82F6' }}
                    >
                      {workspace.icon || '🏢'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-lg" title={workspace.name}>
                        {workspace.name}
                      </CardTitle>
                      {workspace.description && (
                        <CardDescription className="mt-1 line-clamp-2 min-h-10">
                          {workspace.description}
                        </CardDescription>
                      )}
                    </div>
                </div>
              </CardHeader>
              <CardContent className="border-t bg-muted/20 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <Badge variant="secondary" className="font-normal">
                      {workspace.owner === user?.id ? 'Proprietário' : 'Membro'}
                    </Badge>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWorkspace(workspace);
                      }}
                      title="Editar"
                      aria-label={`Editar workspace ${workspace.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingWorkspace(workspace);
                      }}
                      disabled={workspace.owner !== user?.id}
                      title={workspace.owner !== user?.id ? 'Apenas o proprietário pode excluir' : 'Excluir'}
                      aria-label={`Excluir workspace ${workspace.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {workspaces.length === 0 && (
            <div className="col-span-full">
              <WorkEmptyState
                title="Nenhum workspace encontrado"
                description="Crie seu primeiro workspace para começar a organizar seus projetos."
                action={
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Workspace
                  </Button>
                }
              />
            </div>
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
