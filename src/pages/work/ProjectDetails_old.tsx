import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useHierarchyTasks } from '@/hooks/useHierarchyTasks';
import { useSpaces } from '@/hooks/useSpaces';
import MainLayout from '@/components/MainLayout';
import EditProjectModal from '@/components/modals/EditProjectModal';
import DeleteConfirmDialog from '@/components/modals/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Space } from '@/types/hierarchy';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateSpace, deleteSpace } = useSpaces(project?.workspace_id);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('spaces')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (err) {
        console.error('Error fetching project:', err);
        toast.error('Erro ao carregar projeto');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleUpdate = async (data: {
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  }) => {
    if (!project) return;

    const { error } = await updateSpace(project.id, data);

    if (error) {
      toast.error('Erro ao atualizar projeto: ' + error.message);
      throw error;
    }

    toast.success('Projeto atualizado com sucesso!');

    // Reload project data
    const { data: updated, error: fetchError } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', project.id)
      .single();

    if (!fetchError && updated) {
      setProject(updated);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    setIsDeleting(true);

    const { error } = await deleteSpace(project.id);

    if (error) {
      toast.error('Erro ao excluir projeto: ' + error.message);
      setIsDeleting(false);
      return;
    }

    toast.success('Projeto excluído com sucesso!');
    navigate('/work');
  };

  if (loading) {
    return (
      <MainLayout module="work">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout module="work">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <p className="text-lg font-medium">Projeto não encontrado</p>
                <Button onClick={() => navigate('/work')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Projetos
                </Button>
              </div>
            </CardContent>
          </Card>
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
            <div className="flex items-center gap-3">
              {project.icon && (
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl"
                  style={{ backgroundColor: project.color || '#3B82F6' }}
                >
                  {project.icon}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditOpen(true)}
              title="Editar Projeto"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteOpen(true)}
              title="Excluir Projeto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas (1)</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">1</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">1</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Progresso do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso Geral</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Tarefas do Projeto</h2>
              <Button onClick={() => toast.info('Criar Tarefa - Em desenvolvimento')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>

            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Em breve</p>
                  <p className="text-sm text-muted-foreground">
                    Aqui você verá todas as tarefas deste projeto
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kanban" className="space-y-4 mt-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Em breve</p>
                  <p className="text-sm text-muted-foreground">
                    Quadro Kanban para gerenciar tarefas visualmente
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {project && (
        <>
          <EditProjectModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            project={project}
            onUpdate={handleUpdate}
          />

          <DeleteConfirmDialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDelete}
            title="Excluir Projeto"
            description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita e todas as tarefas, listas e folders dentro dele serão permanentemente excluídos."
            itemName={project.name}
            isLoading={isDeleting}
          />
        </>
      )}
    </MainLayout>
  );
};

export default ProjectDetails;
