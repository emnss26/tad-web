import axios from 'axios';

const SHEETS_URL = 'https://developer.api.autodesk.com/construction/sheets/v1';

export const AccSheetsLib = {
  /**
   * Obtiene conjuntos de versiones (Version Sets)
   */
  getVersionSets: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${SHEETS_URL}/projects/${projectId}/version-sets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene Sheets (Láminas)
   */
  getSheets: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${SHEETS_URL}/projects/${projectId}/sheets`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Sheets:', error.response?.data || error.message);
      throw error;
    }
  }
};