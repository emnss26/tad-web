import axios from 'axios';

const DOCS_URL = 'https://developer.api.autodesk.com/bim360/docs/v1';

export const AccDocsLib = {
  /**
   * Obtiene permisos de una carpeta
   */
  getFolderPermissions: async (token: string, projectId: string, folderId: string) => {
    try {
      const response = await axios.get(`${DOCS_URL}/projects/${projectId}/folders/${folderId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Folder Permissions:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene definiciones de atributos personalizados de una carpeta
   */
  getFolderAttributeDefinitions: async (token: string, projectId: string, folderId: string) => {
    try {
      const response = await axios.get(`${DOCS_URL}/projects/${projectId}/folders/${folderId}/custom-attribute-definitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Actualiza atributos personalizados en lote (Batch Update)
   */
  batchUpdateAttributes: async (token: string, projectId: string, versionId: string, payload: any) => {
    try {
      const response = await axios.post(
        `${DOCS_URL}/projects/${projectId}/versions/${versionId}/custom-attributes:batch-update`,
        payload,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};