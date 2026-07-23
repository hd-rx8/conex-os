import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Search,
  TrendingUp,
} from 'lucide-react';

import MainLayout from '@/components/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WorkOverviewCharts } from '@/features/work/components/WorkOverviewCharts';
import { WorkPageHeader } from '@/features/work/components/WorkPageHeader';
import {
  WorkEmptyState,
  WorkErrorState,
  WorkLoadingState,
} from '@/features/work/components/WorkStates';
import { useWorkContext } from '@/features/work/context/WorkContext';
import {
  useWorkspaceTasksQuery,
  useWorkspacesQuery,
  useWorkspaceTreeQuery,
} from '@/features/work/hooks/useWorkData';
import { deriveWorkTaskMetrics } from '@/features/work/view/workTaskSelectors';

const METRIC_STYLE = [
  { icon: FolderKanban, className: 'text-blue-600 bg-blue-500/10' },
  { icon: TrendingUp, className: 'text-indigo-600 bg-indigo-500/10' },
  { icon: Clock3, className: 'text-amber-600 bg-amber-500/10' },
  { icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-500/10' },
] as const;

export default function WorkOverview() {
  const navigate = useNavigate();
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useWorkContext();
  const [search, setSearch] = useState('');
  const workspacesQuery = useWorkspacesQuery();
  const workspaces = workspacesQuery.data ?? [];

  useEffect(() => {
    const selectedExists = workspaces.some(
      (workspace) => workspace.id === selectedWorkspaceId,
    );
    if (workspaces[0] && !selectedExists) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [selectedWorkspaceId, setSelectedWorkspaceId, workspaces]);

  const treeQuery = useWorkspaceTreeQuery(selectedWorkspaceId);
  const tasksQuery = useWorkspaceTasksQuery(selectedWorkspaceId);
  const projects = treeQuery.data?.spaces ?? [];
  const tasks = tasksQuery.data ?? [];
  const taskMetrics = deriveWorkTaskMetrics(tasks);
  const activeProjects = projects.filter(
    (project) => project.status === 'Ativo',
  ).length;
  const completedProjects = projects.filter(
    (project) => project.status === 'Concluído',
  ).length;

  const visibleProjects = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return projects;
    return projects.filter((project) =>
      project.name.toLocaleLowerCase('pt-BR').includes(normalized),
    );
  }, [projects, search]);

  if (workspacesQuery.isLoading) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkLoadingState label="Carregando seu workspace…" />
      </MainLayout>
    );
  }

  if (workspacesQuery.error || treeQuery.error || tasksQuery.error) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkErrorState
          onRetry={() => {
            void workspacesQuery.refetch();
            void treeQuery.refetch();
            void tasksQuery.refetch();
          }}
        />
      </MainLayout>
    );
  }

  if (workspaces.length === 0) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkEmptyState
          title="Crie seu primeiro workspace"
          description="Workspaces organizam seus projetos, listas e tarefas."
        />
      </MainLayout>
    );
  }

  if (treeQuery.isLoading || tasksQuery.isLoading || !treeQuery.data) {
    return (
      <MainLayout module="work" showGlobalFab={false}>
        <WorkLoadingState label="Preparando sua visão geral…" />
      </MainLayout>
    );
  }

  const metrics = [
    {
      label: 'Total de projetos',
      value: projects.length,
      detail: `${activeProjects} ${activeProjects === 1 ? 'ativo' : 'ativos'}`,
    },
    {
      label: 'Projetos ativos',
      value: activeProjects,
      detail: 'Em andamento',
    },
    {
      label: 'Tarefas pendentes',
      value: taskMetrics.pending,
      detail: `${taskMetrics.overdue} em atraso`,
    },
    {
      label: 'Projetos concluídos',
      value: completedProjects,
      detail: 'Finalizados',
    },
  ];

  return (
    <MainLayout module="work" showGlobalFab={false}>
      <div className="space-y-6 pb-10">
        <WorkPageHeader
          eyebrow={treeQuery.data.name}
          title="Visão geral"
          description="Acompanhe projetos, prazos e produtividade em um único lugar."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = METRIC_STYLE[index].icon;
            return (
              <Card key={metric.label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.detail}</p>
                  </div>
                  <span
                    className={`rounded-xl p-3 ${METRIC_STYLE[index].className}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <WorkOverviewCharts projects={projects} tasks={tasks} />

        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Projetos</h2>
              <p className="text-sm text-muted-foreground">
                {visibleProjects.length} de {projects.length} projetos
              </p>
            </div>
            <label className="relative w-full sm:w-72">
              <span className="sr-only">Buscar projetos</span>
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                className="pl-9"
                placeholder="Buscar projetos…"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tarefas</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead className="text-right">Abrir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProjects.map((project) => {
                  const projectTasks = tasks.filter(
                    (task) => task.context.space_id === project.id,
                  );
                  const completed = projectTasks.filter(
                    (task) => task.status === 'Concluída',
                  ).length;
                  const progress =
                    projectTasks.length === 0
                      ? 0
                      : Math.round((completed / projectTasks.length) * 100);
                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/work/project/${project.id}`)}
                    >
                      <TableCell>
                        <p className="font-medium">{project.name}</p>
                        {project.description && (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {project.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{project.status}</Badge>
                      </TableCell>
                      <TableCell>{projectTasks.length}</TableCell>
                      <TableCell>{progress}%</TableCell>
                      <TableCell className="text-right">
                        <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
