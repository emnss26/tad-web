import api from '../services/api';

export const AccService = {
  // 1. Obtener Lista de Proyectos (Discovery)
  getProjects: async () => {
    const response = await api.get(`/acc/projects`);
    return response.data.data; 
  },

  // 2. Obtener Detalle de un Proyecto
  getProjectData: async (projectId: string) => {
    const response = await api.get(`/acc/projects/${projectId}`);
    return response.data.data;
  },

  // 3. Obtener Usuarios
  getProjectUsers: async (projectId: string) => {
    const response = await api.get(`/acc/projects/${projectId}/users`);
    return response.data.data;
  },

  // 4. Obtener Issues
  getProjectIssues: async (projectId: string) => {
    const response = await api.get(`/acc/projects/${projectId}/issues`);
    return response.data.data;
  },

  // 5. Obtener RFIs
  getProjectRfis: async (projectId: string) => {
    const response = await api.get(`/acc/projects/${projectId}/rfis`);
    return response.data.data;
  },

  // 6. Obtener Submittals
  getProjectSubmittals: async (projectId: string) => {
    const response = await api.get(`/acc/projects/${projectId}/submittals`);
    return response.data.data;
  },

  // 7. (Placeholder) Modelo Federado
  // Esto lo implementaremos cuando hagamos la parte de Data Management
  getFederatedModel: async (accountId: string, projectId: string) => {
    console.warn("Federated Model service not yet implemented in backend V2");
    return null; 
  }
};