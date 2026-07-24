import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Folder, LayoutGrid } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkEmptyState, WorkLoadingState, WorkErrorState } from '@/features/work/components/WorkStates';
import { useWorkspacesQuery, useWorkspaceTreeQuery } from '@/features/work/hooks/useWorkData';

export default function WorkspaceDetails() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  
  const workspacesQuery = useWorkspacesQuery();
  const treeQuery = useWorkspaceTreeQuery(workspaceId);

  const workspace = useMemo(() => {
    return workspacesQuery.data?.find((w) => w.id === workspaceId);
  }, [workspacesQuery.data, workspaceId]);

  const projects = useMemo(() => {
    if (!treeQuery.data) return [];
    
    // Combine standalone spaces and spaces inside folders
    const allProjects = [...treeQuery.data.spaces];
    
    treeQuery.data.workspace_folders?.forEach(folder => {
      folder.spaces.forEach(space => {
        allProjects.push({
          ...space,
          folderName: folder.name
        } as any); // using as any to allow ad-hoc folderName or map to new type
      });
    });
    
    return allProjects.sort((a, b) => a.position - b.position);
  }, [treeQuery.data]);

  if (workspacesQuery.isLoading || treeQuery.isLoading) {
    return (
      <MainLayout module="work">
        <div className="app-page">
          <WorkLoadingState label="Carregando workspace…" />
        </div>
      </MainLayout>
    );
  }

  if (workspacesQuery.error || treeQuery.error) {
    return (
      <MainLayout module="work">
        <div className="app-page">
          <WorkErrorState onRetry={() => {
            void workspacesQuery.refetch();
            void treeQuery.refetch();
          }} />
        </div>
      </MainLayout>
    );
  }

  if (!workspace) {
    return (
      <MainLayout module="work">
        <div className="app-page">
          <WorkEmptyState
            title="Workspace não encontrado"
            description="O workspace não existe ou você não tem acesso."
            action={
              <Button onClick={() => navigate('/work/workspaces')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Workspaces
              </Button>
            }
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout module="work">
      <div className="app-page pb-10">
        <PageHeader
          eyebrow="Work Management / Workspace"
          title={workspace.name}
          description={workspace.description || "Gerencie os projetos deste workspace."}
          breadcrumbs={
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 w-fit text-muted-foreground"
              onClick={() => navigate('/work/workspaces')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Workspaces
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => navigate(`/work/project/${project.id}`)}
            >
              <CardHeader className="pb-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm"
                    style={{ backgroundColor: project.color || '#3B82F6' }}
                  >
                    {project.icon || <LayoutGrid className="h-6 w-6 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-lg" title={project.name}>
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="mt-1 line-clamp-2 min-h-10">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="border-t bg-muted/20 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={project.status === 'Ativo' ? 'default' : 'secondary'} className="font-normal">
                      {project.status}
                    </Badge>
                  </div>

                  {(project as any).folderName && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Folder className="h-3 w-3" />
                      <span className="truncate max-w-[100px]" title={(project as any).folderName}>
                        {(project as any).folderName}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full">
              <WorkEmptyState
                title="Nenhum projeto encontrado"
                description="Este workspace ainda não possui projetos criados."
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
