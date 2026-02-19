import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUS_OPTIONS } from "./task.types";
import type { ProjectUser, TaskItem } from "./task.types";
import { getNextTaskId } from "./task.utils";

type TaskFormData = {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: string;
  startDate: string;
  endDate: string;
};

interface TaskManagementFormProps {
  tasks: TaskItem[];
  users: ProjectUser[];
  projectId: string;
  initialData?: TaskItem;
  onSubmit: (task: TaskItem) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

function toDateInput(value?: string | null): string {
  if (!value) return "";
  const asString = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;
  const date = new Date(asString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function displayUserName(user: ProjectUser): string {
  if (user.name && user.name.trim()) return user.name;
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (fullName) return fullName;
  return user.email || "Unknown User";
}

export function TaskManagementForm({
  tasks,
  users,
  projectId,
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: TaskManagementFormProps) {
  const defaultStatus = TASK_STATUS_OPTIONS[0];

  const [form, setForm] = useState<TaskFormData>({
    id: initialData?.id || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    assignedTo: initialData?.assignedTo || "",
    status: initialData?.status || defaultStatus,
    startDate: toDateInput(initialData?.startDate) || new Date().toISOString().slice(0, 10),
    endDate: toDateInput(initialData?.endDate) || new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!isEditing) {
      const generatedId = getNextTaskId(
        tasks.map((task) => task.id),
        projectId
      );

      setForm((prev) => ({ ...prev, id: generatedId }));
    }
  }, [isEditing, projectId, tasks]);

  const orderedUsers = useMemo(() => {
    return (users || []).filter((user) => user.id && displayUserName(user));
  }, [users]);

  const handleChange = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "startDate" && next.endDate < next.startDate) {
        next.endDate = next.startDate;
      }
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      id: form.id,
      title: form.title,
      description: form.description,
      assignedTo: form.assignedTo,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" value={form.id} />

      <div className="space-y-2">
        <Label htmlFor="task-title">Titulo de la tarea</Label>
        <Input
          id="task-title"
          value={form.title}
          onChange={(event) => handleChange("title", event.target.value)}
          placeholder="Ingresa el titulo de la tarea"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Descripcion</Label>
        <textarea
          id="task-description"
          className="flex min-h-[84px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={form.description}
          onChange={(event) => handleChange("description", event.target.value)}
          placeholder="Describe la tarea"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Asignar a</Label>
          <Select
            value={form.assignedTo}
            onValueChange={(value) => handleChange("assignedTo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un usuario" />
            </SelectTrigger>
            <SelectContent>
              {orderedUsers.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {displayUserName(user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={form.status}
            onValueChange={(value) => handleChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona estado" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-start-date">Fecha de inicio</Label>
          <Input
            id="task-start-date"
            type="date"
            value={form.startDate}
            onChange={(event) => handleChange("startDate", event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-end-date">Fecha de fin</Label>
          <Input
            id="task-end-date"
            type="date"
            value={form.endDate}
            onChange={(event) => handleChange("endDate", event.target.value)}
            min={form.startDate}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {isEditing ? "Actualizar tarea" : "Crear tarea"}
        </Button>
      </div>
    </form>
  );
}
