import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, ArrowRight } from "lucide-react";

const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  techStack: z.string().optional(),
});

export default function ProjectNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      techStack: "react-node",
    },
  });

  const createProject = useCreateProject({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setLocation(`/projects/${data.id}`);
      },
    }
  });

  const onSubmit = (data: z.infer<typeof projectSchema>) => {
    createProject.mutate({ data });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Terminal className="w-8 h-8 text-primary" />
          Initialize System
        </h1>
        <p className="text-muted-foreground mt-2">Define the parameters and requirements for your new AI-generated project.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Inventory Management API" {...field} data-testid="input-project-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="techStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technology Stack</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tech-stack">
                          <SelectValue placeholder="Select a tech stack" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="react-node">React + Node.js (Express)</SelectItem>
                        <SelectItem value="nextjs">Next.js (App Router)</SelectItem>
                        <SelectItem value="python-fastapi">React + Python (FastAPI)</SelectItem>
                        <SelectItem value="go-react">React + Go (Fiber)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>The primary technologies the AI should use.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the system in detail. What are the main features? Data models? Workflows?" 
                        className="min-h-[200px] font-mono text-sm"
                        {...field} 
                        data-testid="input-project-description" 
                      />
                    </FormControl>
                    <FormDescription>Be as specific as possible for better results.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/dashboard")}
                  data-testid="btn-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProject.isPending}
                  className="gap-2"
                  data-testid="btn-create-project"
                >
                  {createProject.isPending ? "Initializing..." : "Create Project"}
                  {!createProject.isPending && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
