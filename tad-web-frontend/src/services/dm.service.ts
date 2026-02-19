import api from './api'; // Tu instancia de axios configurada

export interface DmFolderNode {
  id: string;
  name: string;
  type: "folder" | "file" | string;
  children?: DmFolderNode[];
  version_urn?: string | null;
  version?: number | null;
  versiontype?: string | null;
  versionschema?: string | null;
}

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
  },

  getFederatedModel: async (projectId: string, accountId: string) => {
    const response = await api.get(`/dm/items/${accountId}/${projectId}/federatedmodel`);
    return response.data?.data || null;
  },

  getFederatedIfcModel: async (projectId: string, accountId: string) => {
    const response = await api.get(`/dm/items/${accountId}/${projectId}/federated-ifc`);
    return response.data?.data || null;
  },

  getFederatedGlbUrl: async (projectId: string, accountId: string) => {
    const response = await api.get(`/dm/items/${accountId}/${projectId}/federated-glb`);
    return response.data?.data || null;
  },

  getFolderStructure: async (projectId: string, accountId: string): Promise<DmFolderNode[]> => {
    const response = await api.get(`/dm/folders/${accountId}/${projectId}/folder-structure`);
    return response.data?.data || [];
  },

  getFileData: async (projectId: string, accountId: string, itemIds: string[]) => {
    const response = await api.post(`/dm/items/${accountId}/${projectId}/file-data`, { itemIds });
    return response.data?.data || [];
  },

  getFileRevisions: async (projectId: string, accountId: string, itemIds: string[]) => {
    const response = await api.post(`/dm/items/${accountId}/${projectId}/file-revisions`, { itemIds });
    return response.data?.data || [];
  },
};
