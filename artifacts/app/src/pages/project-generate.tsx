import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Terminal, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";

type LogEntry = {
  id: number;
  time: string;
  type: "status" | "progress" | "error" | "complete" | "done" | "info";
  message: string;
};

export default function ProjectGenerate() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  const { data: project } = useGetProject(projectId, {
    query: {
      enabled: !!projectId,
      queryKey: getGetProjectQueryKey(projectId)
    }
  });

  useEffect(() => {
    if (project && !prompt && !hasStarted) {
      setPrompt(`Generate a production-ready application based on this description:\n\n${project.description}`);
    }
  }, [project, prompt, hasStarted]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  const startGeneration = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setHasStarted(true);
    setIsDone(false);
    setProgress(5);
    setLogs([]);
    addLog("info", "Initializing AI architect...");

    try {
      const response = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === "status") {
                addLog("status", data.message);
                setProgress(prev => Math.min(prev + 5, 90));
              } else if (data.type === "progress") {
                addLog("progress", `Writing: \n${data.content.substring(0, 100)}...`);
              } else if (data.type === "complete") {
                addLog("complete", `Generation complete. ${data.fileCount} files created.\n${data.summary}`);
                setProgress(100);
              } else if (data.type === "error") {
                addLog("error", data.message);
                setIsGenerating(false);
                return;
              } else if (data.type === "done") {
                setIsDone(true);
                setIsGenerating(false);
                addLog("done", "System is ready.");
                queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
              }
            } catch (e) {
              console.error("Error parsing SSE data", e, line);
            }
          }
        }
      }
    } catch (error: any) {
      addLog("error", error.message || "An unexpected error occurred");
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 -ml-4" onClick={() => setLocation(`/projects/${projectId}`)}>
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">System Generation</h1>
        <p className="text-muted-foreground">The AI is ready to orchestrate your application.</p>
      </div>

      {!hasStarted ? (
        <Card className="p-6 space-y-6 border-primary/20 bg-card">
          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Finalize Instructions
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-[200px] p-4 font-mono text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y"
              placeholder="Enter generation prompt..."
              data-testid="input-generate-prompt"
            />
          </div>
          <div className="flex justify-end">
            <Button 
              size="lg" 
              onClick={startGeneration}
              disabled={!prompt.trim() || isGenerating}
              className="font-bold text-md px-8"
              data-testid="btn-start-generation-confirm"
            >
              Initialize Build Process
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium font-mono text-primary uppercase tracking-wider">
                  {isGenerating ? "Processing..." : isDone ? "Completed" : "Failed"}
                </span>
                <span className="text-sm text-muted-foreground font-mono">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="w-12 flex justify-center">
              {isGenerating ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : isDone ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-destructive" />
              )}
            </div>
          </div>

          <Card className="bg-[#0d1117] border-border overflow-hidden">
            <div className="bg-[#161b22] px-4 py-2 border-b border-border flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">Terminal Output</span>
            </div>
            <div className="p-4 h-[500px] overflow-y-auto font-mono text-sm space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <span className="text-muted-foreground shrink-0">{log.time}</span>
                  <span className={`whitespace-pre-wrap break-words ${
                    log.type === "error" ? "text-destructive" :
                    log.type === "complete" || log.type === "done" ? "text-green-400" :
                    log.type === "status" ? "text-primary" :
                    "text-gray-300"
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
              {isGenerating && (
                <div className="flex gap-4 animate-pulse text-muted-foreground">
                  <span>...</span>
                  <span>_</span>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </Card>

          {isDone && (
            <div className="flex justify-end pt-4">
              <Button onClick={() => setLocation(`/projects/${projectId}`)} size="lg">
                View Generated System
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
