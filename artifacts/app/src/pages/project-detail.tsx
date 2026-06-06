import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetProject, 
  useListProjectFiles,
  useDeleteProject,
  getGetProjectQueryKey,
  getListProjectFilesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, FileCode2, Play, Trash2, ArrowLeft, Download, Activity, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: {
      enabled: !!projectId,
      queryKey: getGetProjectQueryKey(projectId)
    }
  });

  const { data: files, isLoading: filesLoading } = useListProjectFiles(projectId, {
    query: {
      enabled: !!projectId && project?.status === "completed",
      queryKey: getListProjectFilesQueryKey(projectId)
    }
  });

  const deleteProject = useDeleteProject({
    mutation: {
      onSuccess: () => {
        setLocation("/dashboard");
      }
    }
  });

  const onDelete = () => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProject.mutate({ id: projectId });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "generating": return <Activity className="w-4 h-4 text-primary animate-pulse" />;
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Terminal className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Button className="mt-4" onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 -ml-4" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Button>
        <div className="flex gap-2">
          {project.status === "pending" || project.status === "failed" ? (
            <Button onClick={() => setLocation(`/projects/${project.id}/generate`)} className="gap-2" data-testid="btn-start-generation">
              <Play className="w-4 h-4" />
              Generate Code
            </Button>
          ) : project.status === "generating" ? (
            <Button disabled variant="outline" className="gap-2">
              <Activity className="w-4 h-4 animate-pulse text-primary" />
              Generating...
            </Button>
          ) : null}
          <Button variant="destructive" size="icon" onClick={onDelete} data-testid="btn-delete-project">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{project.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    Created {format(new Date(project.createdAt), "PPP p")}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="flex gap-2 items-center px-3 py-1">
                  {getStatusIcon(project.status)}
                  <span className="uppercase">{project.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>

          {project.status === "completed" && (
            <Card className="min-h-[500px] flex flex-col overflow-hidden">
              <CardHeader className="bg-secondary/50 border-b border-border py-3">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-primary" />
                  Generated Code
                </CardTitle>
              </CardHeader>
              <div className="flex flex-1 overflow-hidden">
                {/* File Explorer */}
                <div className="w-64 border-r border-border bg-secondary/20 p-2 overflow-y-auto">
                  {filesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : files && files.length > 0 ? (
                    <div className="space-y-1">
                      {files.map(file => (
                        <button
                          key={file.id}
                          onClick={() => setSelectedFile(file.path)}
                          className={`w-full text-left px-3 py-2 text-sm font-mono rounded-md transition-colors truncate ${
                            selectedFile === file.path 
                              ? "bg-primary/20 text-primary" 
                              : "hover:bg-secondary text-muted-foreground"
                          }`}
                        >
                          {file.path}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center">No files generated</div>
                  )}
                </div>
                
                {/* File Content */}
                <div className="flex-1 bg-[#0d1117] overflow-auto relative">
                  {selectedFile ? (
                    <pre className="p-4 text-sm font-mono text-gray-300">
                      <code>
                        {files?.find(f => f.path === selectedFile)?.content || ""}
                      </code>
                    </pre>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FileCode2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Select a file to view its contents</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Tech Stack</div>
                <Badge variant="secondary" className="font-mono">{project.techStack || "Auto-detect"}</Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Project ID</div>
                <div className="font-mono text-sm">{project.id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                <div className="text-sm">{format(new Date(project.updatedAt), "PPP p")}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
