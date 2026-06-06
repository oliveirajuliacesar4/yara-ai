import { useListProjects, useGetProjectStats, getListProjectsQueryKey, getGetProjectStatsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Terminal, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProjectStats({
    query: { queryKey: getGetProjectStatsQueryKey() }
  });

  const { data: projects, isLoading: projectsLoading } = useListProjects({
    query: { queryKey: getListProjectsQueryKey() }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "generating": return <Activity className="w-4 h-4 text-primary animate-pulse" />;
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your generated systems.</p>
        </div>
        <Link href="/projects/new">
          <Button data-testid="btn-new-project">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Projects</CardDescription>
              <CardTitle className="text-4xl font-mono">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-4xl font-mono text-green-500">{stats.completed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Generating</CardDescription>
              <CardTitle className="text-4xl font-mono text-primary">{stats.generating}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-4xl font-mono text-destructive">{stats.failed}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Recent Projects</h2>
        
        {projectsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Terminal className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        {project.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">{project.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium uppercase">
                        {getStatusIcon(project.status)}
                        {project.status}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(project.updatedAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed rounded-xl bg-card">
            <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground mb-4">Create your first AI-generated system to get started.</p>
            <Link href="/projects/new">
              <Button variant="outline">Create Project</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
