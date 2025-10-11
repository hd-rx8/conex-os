import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit, ListChecks } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSpaces } from '@/hooks/useSpaces';
import useLists from '@/hooks/useLists';
import useTasks from '@/hooks/useTasks';
import MainLayout from '@/components/MainLayout';
import EditProjectModal from '@/components/modals/EditProjectModal';
import CreateListModal from '@/components/modals/CreateListModal';
import EditListModal from '@/components/modals/EditListModal';
import DeleteConfirmDialog from '@/components/modals/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Space } from '@/types/hierarchy';
import type { List } from '@/hooks/useLists';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [deletingList, setDeletingList] = useState<List | null>(null);

  const { updateSpace, deleteSpace } = useSpaces(project?.workspace_id);
  const { lists, loading: listsLoading, createList, updateList, deleteList, refetch: refetchLists } = useLists(projectId);
  const { tasks } = useTasks(undefined, projectId);

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

  const handleCreateList = async (data: {
    space_id: string;
    folder_id: string | null;
    name: string;
    description: string | null;
  }) => {
    const { error } = await createList(data);
    if (error) {
      toast.error('Erro ao criar lista: ' + error.message);
      throw error;
    }

    toast.success('Lista criada com sucesso!');
    await refetchLists();
    setIsCreateListOpen(false);
  };

  const handleUpdateList = async (data: { name: string; description: string | null }) => {
    if (!editingList) return;

    const { error } = await updateList(editingList.id, data);
    if (error) {
      toast.error('Erro ao atualizar lista: ' + error.message);
      return;
    }

    toast.success('Lista atualizada com sucesso!');
    await refetchLists();
    setEditingList(null);
  };

  const handleDeleteList = async () => {
    if (!deletingList) return;

    const { error } = await deleteList(deletingList.id);
    if (error) {
      toast.error('Erro ao excluir lista: ' + error.message);
      return;
    }

    toast.success('Lista excluída com sucesso!');
    await refetchLists();
    setDeletingList(null);
  };

  const taskCounts = {
    total: tasks?.length || 0,
    completed: tasks?.filter(t => t.status === 'Concluída').length || 0,
    inProgress: tasks?.filter(t => t.status === 'Em Progresso').length || 0,
    pending: tasks?.filter(t => t.status === 'Pendente').length || 0,
  };

  const progress = taskCounts.total > 0 ? Math.round((taskCounts.completed / taskCounts.total) * 100) : 0;

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
            <TabsTrigger value="lists">Listas ({lists?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{taskCounts.total}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-600">{taskCounts.pending}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{taskCounts.inProgress}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{taskCounts.completed}</p>
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
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Listas</CardTitle>
              </CardHeader>
              <CardContent>
                {lists && lists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lists.map(list => {
                      const listTasks = tasks?.filter(t => t.list_id === list.id) || [];
                      return (
                        <Card
                          key={list.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/work/list/${list.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <ListChecks className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-medium">{list.name}</h3>
                              </div>
                            </div>
                            {list.description && (
                              <p className="text-xs text-muted-foreground mb-2">{list.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {listTasks.length} tarefa{listTasks.length !== 1 ? 's' : ''}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma lista criada ainda</p>
                    <Button className="mt-4" onClick={() => setIsCreateListOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Lista
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lists" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Listas do Projeto</h2>
              <Button onClick={() => setIsCreateListOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Lista
              </Button>
            </div>

            {listsLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando listas...</p>
            ) : lists && lists.length > 0 ? (
              <div className="space-y-3">
                {lists.map(list => {
                  const listTasks = tasks?.filter(t => t.list_id === list.id) || [];
                  return (
                    <Card key={list.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => navigate(`/work/list/${list.id}`)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <ListChecks className="h-5 w-5" />
                              <h3 className="font-medium text-lg">{list.name}</h3>
                            </div>
                            {list.description && (
                              <p className="text-sm text-muted-foreground mb-2">{list.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {listTasks.length} tarefa{listTasks.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingList(list);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingList(list);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <p className="text-lg font-medium">Nenhuma lista criada</p>
                    <p className="text-sm text-muted-foreground">
                      Crie listas para organizar as tarefas do projeto
                    </p>
                    <Button onClick={() => setIsCreateListOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Lista
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
            isDeleting={isDeleting}
          />

          <CreateListModal
            isOpen={isCreateListOpen}
            onClose={() => setIsCreateListOpen(false)}
            spaceId={project.id}
            onCreateList={handleCreateList}
          />

          {editingList && (
            <EditListModal
              isOpen={true}
              onClose={() => setEditingList(null)}
              list={editingList}
              onUpdate={handleUpdateList}
            />
          )}

          {deletingList && (
            <DeleteConfirmDialog
              isOpen={true}
              onClose={() => setDeletingList(null)}
              onConfirm={handleDeleteList}
              title="Excluir Lista"
              description="Tem certeza que deseja excluir esta lista? Todas as tarefas serão excluídas também."
              itemName={deletingList.name}
            />
          )}
        </>
      )}
    </MainLayout>
  );
};

export default ProjectDetails;
