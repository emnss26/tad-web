import axios from 'axios';

const DOCS_URL = 'https://developer.api.autodesk.com/bim360/docs/v1';

export const Bim360DocsLib = {
  getAttributeDefinitions: async (token: string, projectId: string, folderId: string) => {
    try {
      const response = await axios.get(`${DOCS_URL}/projects/${projectId}/folders/${folderId}/custom-attribute-definitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Attribute Definitions:', error.response?.data || error.message);
      throw error;
    }
  },

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
  }
};