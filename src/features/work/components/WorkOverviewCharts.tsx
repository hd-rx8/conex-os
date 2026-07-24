import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SpaceTree, Workspace, WorkTaskItem } from '@/types/hierarchy';
import { WorkEmptyState } from './WorkStates';

interface WorkOverviewChartsProps {
  projects: readonly SpaceTree[];
  tasks: readonly WorkTaskItem[];
  workspaces: readonly Workspace[];
  allTasks: readonly WorkTaskItem[];
}

const PROJECT_COLORS = ['#3b82f6', '#10b981', '#94a3b8'];
const TASK_COLORS = ['#f59e0b', '#3b82f6', '#10b981'];
const WORKSPACE_COLORS = ['#8b5cf6', '#ec4899', '#f43f5e'];

export function WorkOverviewCharts({
  projects,
  tasks,
  workspaces,
  allTasks,
}: WorkOverviewChartsProps) {
  const projectStatus = ['Ativo', 'Concluído', 'Arquivado'].map((status) => ({
    name: status,
    value: projects.filter((project) => project.status === status).length,
  }));
  const taskStatus = ['Pendente', 'Em Progresso', 'Concluída'].map((status) => ({
    name: status,
    value: tasks.filter((task) => task.status === status).length,
  }));
  const productivity = projects.map((project) => {
    const projectTasks = tasks.filter(
      (task) => task.context.space_id === project.id,
    );
    const completed = projectTasks.filter(
      (task) => task.status === 'Concluída',
    ).length;
    return {
      name: project.name,
      progresso:
        projectTasks.length === 0
          ? 0
          : Math.round((completed / projectTasks.length) * 100),
    };
  });

  const workspaceProductivity = workspaces.map((ws) => {
    const wsTasks = allTasks.filter(
      (task) => task.context.workspace_id === ws.id,
    );
    const completed = wsTasks.filter(
      (task) => task.status === 'Concluída',
    ).length;
    return {
      name: ws.name,
      progresso:
        wsTasks.length === 0
          ? 0
          : Math.round((completed / wsTasks.length) * 100),
    };
  });

  if (projects.length === 0 && tasks.length === 0 && workspaces.length === 0) {
    return (
      <WorkEmptyState
        title="Ainda não há dados para analisar"
        description="Crie um projeto e suas primeiras tarefas para acompanhar a produtividade."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Status dos projetos</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={projectStatus}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={82}
                paddingAngle={2}
              >
                {projectStatus.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={PROJECT_COLORS[index % PROJECT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Status das tarefas</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taskStatus}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {taskStatus.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={TASK_COLORS[index % TASK_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="overflow-hidden shadow-sm lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Produtividade por projeto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Percentual de tarefas concluídas por projeto.
          </p>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productivity}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="progresso" fill="#3977d3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden shadow-sm lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Produtividade por workspace</CardTitle>
          <p className="text-sm text-muted-foreground">
            Percentual de tarefas concluídas por workspace.
          </p>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workspaceProductivity}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="progresso" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
