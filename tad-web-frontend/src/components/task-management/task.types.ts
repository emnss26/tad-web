export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  assignedTo?: string;
}

export interface ProjectUser {
  id?: string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export const TASK_STATUS_OPTIONS = [
  "No iniciada",
  "En progreso",
  "Completada",
  "Retrasada",
] as const;
