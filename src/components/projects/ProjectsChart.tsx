import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Project } from '@/hooks/useProjects';
import { Task } from '@/hooks/useTasks';

interface ProjectsChartProps {
  projects?: Project[];
  tasks?: Task[];
  loading?: boolean;
}

const ProjectsChart: React.FC<ProjectsChartProps> = ({ projects, tasks, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preparar dados para o gráfico de status de projetos
  const projectStatusData = [
    {
      status: 'Ativo',
      count: projects?.filter(p => p.status === 'Ativo').length || 0,
      color: '#3b82f6'
    },
    {
      status: 'Concluído',
      count: projects?.filter(p => p.status === 'Concluído').length || 0,
      color: '#10b981'
    },
    {
      status: 'Arquivado',
      count: projects?.filter(p => p.status === 'Arquivado').length || 0,
      color: '#6b7280'
    }
  ];

  // Preparar dados para o gráfico de status de tarefas
  const taskStatusData = [
    {
      status: 'Pendente',
      count: tasks?.filter(t => t.status === 'Pendente').length || 0,
      color: '#f59e0b'
    },
    {
      status: 'Em Progresso',
      count: tasks?.filter(t => t.status === 'Em Progresso').length || 0,
      color: '#3b82f6'
    },
    {
      status: 'Concluída',
      count: tasks?.filter(t => t.status === 'Concluída').length || 0,
      color: '#10b981'
    }
  ];

  // Dados para gráfico de produtividade por projeto
  const projectProductivityData = projects?.map(project => {
    const projectTasks = tasks?.filter(task => task.project_id === project.id) || [];
    const completedTasks = projectTasks.filter(task => task.status === 'Concluída');
    const productivity = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;
    
    return {
      name: project.title.length > 15 ? `${project.title.substring(0, 15)}...` : project.title,
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      productivity: Math.round(productivity)
    };
  }).slice(0, 5) || []; // Mostrar apenas os 5 primeiros projetos

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'totalTasks' ? 'Total de tarefas' : 
               entry.dataKey === 'completedTasks' ? 'Tarefas concluídas' :
               entry.dataKey === 'productivity' ? 'Produtividade' : entry.dataKey}: {entry.value}
              {entry.dataKey === 'productivity' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Gráfico de Status dos Projetos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status dos Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [value, props.payload.status]}
                labelFormatter={() => ''}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-4">
            {projectStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.status}: {item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Status das Tarefas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status das Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, 'Quantidade']}
                labelFormatter={(label) => `Status: ${label}`}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Produtividade por Projeto */}
      {projectProductivityData.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Produtividade por Projeto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Porcentagem de tarefas concluídas por projeto
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectProductivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalTasks" fill="#e5e7eb" name="Total de tarefas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completedTasks" fill="#10b981" name="Tarefas concluídas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Resumo Rápido */}
      <Card className={projectProductivityData.length > 0 ? "md:col-span-2" : "md:col-span-1"}>
        <CardHeader>
          <CardTitle className="text-lg">Resumo de Atividade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {projects?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total de Projetos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tasks?.filter(t => t.status === 'Concluída').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Tarefas Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {tasks?.filter(t => t.status === 'Pendente').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Tarefas Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(((tasks?.filter(t => t.status === 'Concluída').length || 0) / (tasks?.length || 1)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de Conclusão</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsChart;
