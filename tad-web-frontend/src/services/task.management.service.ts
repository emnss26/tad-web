import api from "./api";

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  assignedTo?: string;
}

export const TaskManagementService = {
  getTasks: async (projectId: string, accountId: string): Promise<TaskItem[]> => {
    const response = await api.get(`/task/${accountId}/${projectId}/tasks`);
    return response.data?.data || [];
  },

  createTask: async (projectId: string, accountId: string, taskData: TaskItem): Promise<TaskItem> => {
    const response = await api.post(`/task/${accountId}/${projectId}/tasks`, [taskData]);
    return response.data?.data?.[0];
  },

  updateTask: async (
    projectId: string,
    accountId: string,
    taskId: string,
    taskData: Partial<TaskItem>
  ): Promise<TaskItem> => {
    const response = await api.patch(`/task/${accountId}/${projectId}/tasks/${taskId}`, taskData);
    return response.data?.data;
  },

  deleteTask: async (projectId: string, accountId: string, taskId: string) => {
    const response = await api.delete(`/task/${accountId}/${projectId}/tasks/${taskId}`);
    return response.data;
  },
};
