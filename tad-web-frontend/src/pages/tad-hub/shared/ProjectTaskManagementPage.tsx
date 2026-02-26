import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PlusCircle, LayoutGrid, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModulePageHeader from "@/components/hub/ModulePageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccService } from "@/services/acc.service";
import { Bim360Service } from "@/services/bim360.service";
import { TaskManagementService } from "@/services/task.management.service";
import { TaskManagementForm } from "@/components/task-management/task-management-form";
import { TaskManagementTable } from "@/components/task-management/task-management-table";
import { TaskManagementGantt } from "@/components/task-management/task-management-gantt";
import type { ProjectUser, TaskItem } from "@/components/task-management/task.types";

type Platform = "acc" | "bim360";

interface ProjectTaskManagementPageProps {
  platform: Platform;
}

function extractUsers(payload: any): ProjectUser[] {
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function ProjectTaskManagementPage({ platform }: ProjectTaskManagementPageProps) {
  const { projectId, accountId } = useParams<{ projectId: string; accountId: string }>();
  const safeProjectId = projectId || "project";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!projectId || !accountId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tasksData, usersData] = await Promise.all([
          TaskManagementService.getTasks(projectId, accountId),
          platform === "acc"
            ? AccService.getProjectUsers(projectId)
            : Bim360Service.getProjectUsers(projectId),
        ]);

        setTasks(tasksData || []);
        setUsers(extractUsers(usersData));
      } catch (err: any) {
        console.error("[ProjectTaskManagementPage]", err);
        setError(err?.message || "Error loading task management data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId, platform, projectId]);

  const handleAddTask = async (newTask: TaskItem) => {
    if (!projectId || !accountId) return;

    try {
      setError(null);
      const created = await TaskManagementService.createTask(projectId, accountId, newTask);
      if (!created) return;

      setTasks((prev) => [...prev, created]);
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err?.message || "Error creating task.");
    }
  };

  const handleUpdateTask = async (taskToUpdate: TaskItem) => {
    if (!projectId || !accountId) return;

    try {
      setError(null);
      const updated = await TaskManagementService.updateTask(
        projectId,
        accountId,
        taskToUpdate.id,
        taskToUpdate
      );

      if (!updated) return;

      setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
    } catch (err: any) {
      setError(err?.message || "Error updating task.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId || !accountId) return;

    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      setError(null);
      await TaskManagementService.deleteTask(projectId, accountId, taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err: any) {
      setError(err?.message || "Error deleting task.");
    }
  };

  return (
    <div className="flex min-h-full">
      <main className="w-full min-w-0 bg-white p-2 px-4">
        <ModulePageHeader
          title="Task Management"
          description={`Manage project tasks, assignments, and scheduling views (${platform.toUpperCase()}).`}
          actions={
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Task
            </Button>
          }
          className="mt-2 mb-6"
        />

        {loading && <p className="text-sm text-muted-foreground">Loading tasks...</p>}

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-600">
            {error}
          </div>
        )}

        {!loading && (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="list" className="flex items-center">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Task List
              </TabsTrigger>
              <TabsTrigger value="gantt" className="flex items-center">
                <BarChart2 className="mr-2 h-4 w-4" />
                Gantt Chart
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <TaskManagementTable
                tasks={tasks}
                users={users}
                projectId={safeProjectId}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            </TabsContent>

            <TabsContent value="gantt">
              <TaskManagementGantt tasks={tasks} />
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Fill in the details for the new task.</DialogDescription>
            </DialogHeader>

            <TaskManagementForm
              tasks={tasks}
              users={users}
              projectId={safeProjectId}
              onSubmit={handleAddTask}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
