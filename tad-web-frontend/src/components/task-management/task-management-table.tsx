import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ProjectUser, TaskItem } from "./task.types";
import { TaskManagementForm } from "./task-management-form";
import { formatTaskDate } from "./task.utils";

interface TaskManagementTableProps {
  tasks: TaskItem[];
  users: ProjectUser[];
  projectId: string;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
}

function getStatusClass(status?: string): string {
  switch (status) {
    case "No iniciada":
      return "bg-gray-200 text-gray-800";
    case "En progreso":
      return "bg-yellow-200 text-yellow-800";
    case "Completada":
      return "bg-green-200 text-green-800";
    case "Retrasada":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
}

function getUserDisplay(user?: ProjectUser): string {
  if (!user) return "Sin asignar";
  if (user.name && user.name.trim()) return user.name;
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (fullName) return fullName;
  return user.email || "Sin asignar";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TaskManagementTable({
  tasks,
  users,
  projectId,
  onUpdateTask,
  onDeleteTask,
}: TaskManagementTableProps) {
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const usersById = useMemo(() => {
    const map = new Map<string, ProjectUser>();
    users.forEach((user) => {
      if (user.id) {
        map.set(String(user.id), user);
      }
    });
    return map;
  }, [users]);

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <TableHead className="w-[320px]">Nombre de la tarea</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de inicio</TableHead>
              <TableHead>Fecha de fin</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  No tasks registered.
                </TableCell>
              </TableRow>
            )}

            {tasks.map((task) => {
              const user = task.assignedTo ? usersById.get(String(task.assignedTo)) : undefined;
              const userName = getUserDisplay(user);

              return (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    {user ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                        </Avatar>
                        <span>{userName}</span>
                      </div>
                    ) : (
                      <span className="italic text-gray-500">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusClass(task.status)}>{task.status || "No iniciada"}</Badge>
                  </TableCell>
                  <TableCell>{formatTaskDate(task.startDate)}</TableCell>
                  <TableCell>{formatTaskDate(task.endDate)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditingTask(task)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onSelect={() => onDeleteTask(task.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar tarea</DialogTitle>
            <DialogDescription>Actualiza los campos y guarda los cambios.</DialogDescription>
          </DialogHeader>

          {editingTask && (
            <TaskManagementForm
              tasks={tasks}
              users={users}
              projectId={projectId}
              initialData={editingTask}
              onSubmit={(updated) => {
                onUpdateTask(updated);
                setEditingTask(null);
              }}
              onCancel={() => setEditingTask(null)}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
