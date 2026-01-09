import api from './api'; // Tu instancia de axios configurada

export const DmService = {
  /**
   * Obtiene todos los archivos de modelo (rvt, dwg, nwd) del proyecto recursivamente.
   * Requiere hubId (b.accountId).
   */
  getProjectModels: async (projectId: string, hubId: string) => {
    const formattedHubId = hubId.startsWith('b.') ? hubId : `b.${hubId}`;
    
    const response = await api.get(`/dm/projects/${projectId}/model-files`, {
      params: { hubId: formattedHubId }
    });
    return response.data;
  }
};