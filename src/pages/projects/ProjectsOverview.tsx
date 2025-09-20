import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { LayoutDashboard, Plus, Loader2, FileText, Calendar, Clock, Eye, Edit, Trash2, Filter, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import ProjectsChart from '@/components/projects/ProjectsChart';
import FloatingActionButton from '@/components/FloatingActionButton';
import useProjects, { CreateProjectData, Project } from '@/hooks/useProjects';
import useTasks from '@/hooks/useTasks';
import { useNavigate } from 'react-router-dom';

const ProjectSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
  </TableRow>
);

const ProjectsOverview: React.FC = () => {
  const { projects, loading, error, createProject, updateProject, deleteProject, refetch } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks(); // Para contar tarefas
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const handleCreateProject = async (data: CreateProjectData) => {
    try {
      const result = await createProject(data);
      if (result.error) {
        throw result.error;
      }
      await refetch();
      setIsCreateModalOpen(false);
      toast.success('Projeto criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      toast.error(`Erro ao criar projeto: ${error.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto? Todas as tarefas associadas serão excluídas.')) return;
    
    try {
      const { error } = await deleteProject(projectId);
      if (error) throw error;
      toast.success('Projeto excluído com sucesso!');
      await refetch();
    } catch (error: any) {
      console.error('Erro ao excluir projeto:', error);
      toast.error('Erro ao excluir projeto.');
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const { error } = await updateProject(projectId, { status: newStatus });
      if (error) throw error;
      toast.success('Status do projeto atualizado com sucesso!');
      await refetch();
    } catch (error: any) {
      console.error('Erro ao atualizar status do projeto:', error);
      toast.error('Erro ao atualizar status do projeto.');
    }
  };

  // Filtrar e ordenar projetos
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = projects.filter(project => {
      // Filtro por termo de busca
      if (searchTerm && !project.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por status
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
        default:
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [projects, searchTerm, statusFilter, sortBy, sortOrder]);

  const countProjectsByStatus = (status: string) => {
    if (!projects) return 0;
    return projects.filter(project => project.status === status).length;
  };

  const countTasksByStatus = (status: string) => {
    if (!tasks) return 0;
    return tasks.filter(task => task.status === status).length;
  };

  const getTasksCountForProject = (projectId: string) => {
    if (!tasks) return { total: 0, completed: 0 };
    const projectTasks = tasks.filter(task => task.project_id === projectId);
    const completedTasks = projectTasks.filter(task => task.status === 'Concluída');
    return { total: projectTasks.length, completed: completedTasks.length };
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluído': return 'bg-green-100 text-green-800 border-green-200';
      case 'Arquivado': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (error) {
    toast.error('Erro ao carregar projetos. Por favor, tente novamente.');
  }

  return (
    <MainLayout module="work">
      <div className="relative pb-20">
        {/* Floating Action Button */}
        <FloatingActionButton
          onClick={() => setIsCreateModalOpen(true)}
          tooltip="Criar Novo Projeto"
          icon={Plus}
        />
        
        {/* Create Project Modal */}
        <CreateProjectModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProject={handleCreateProject}
        />

        {/* Métricas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{projects?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {countProjectsByStatus('Ativo')} ativo{countProjectsByStatus('Ativo') !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">{countProjectsByStatus('Ativo')}</div>
                  <p className="text-xs text-muted-foreground">Em andamento</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-amber-600">{countTasksByStatus('Pendente')}</div>
                  <p className="text-xs text-muted-foreground">Aguardando conclusão</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">{countProjectsByStatus('Concluído')}</div>
                  <p className="text-xs text-muted-foreground">Finalizados</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="mt-8">
          <ProjectsChart 
            projects={projects} 
            tasks={tasks} 
            loading={loading || tasksLoading} 
          />
        </div>

        {/* Filtros */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field as 'created_at' | 'updated_at' | 'title');
                  setSortOrder(order as 'asc' | 'desc');
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated_at-desc">Mais recente</SelectItem>
                    <SelectItem value="updated_at-asc">Mais antigo</SelectItem>
                    <SelectItem value="title-asc">A-Z</SelectItem>
                    <SelectItem value="title-desc">Z-A</SelectItem>
                    <SelectItem value="created_at-desc">Criado recente</SelectItem>
                    <SelectItem value="created_at-asc">Criado antigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Projetos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Projetos ({filteredProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarefas</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <ProjectSkeleton key={index} />
                    ))
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => {
                      const taskCount = getTasksCountForProject(project.id);
                      return (
                        <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{project.title}</div>
                              {project.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {project.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeClass(project.status)}>
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {taskCount.total > 0 ? (
                                <span>
                                  {taskCount.completed}/{taskCount.total}
                                  <span className="text-muted-foreground ml-1">concluídas</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Nenhuma tarefa</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(parseISO(project.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(parseISO(project.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/projects/${project.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateProjectStatus(
                                  project.id,
                                  project.status === 'Ativo' ? 'Concluído' : 'Ativo'
                                )}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Nenhum projeto encontrado com os filtros aplicados.' 
                              : 'Você ainda não tem projetos. Clique em "Criar Novo Projeto" para começar.'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProjectsOverview;