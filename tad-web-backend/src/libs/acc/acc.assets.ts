import axios from 'axios';

const ASSETS_V2_URL = 'https://developer.api.autodesk.com/construction/assets/v2';
const ASSETS_V1_URL = 'https://developer.api.autodesk.com/construction/assets/v1';

export const AccAssetsLib = {
  /**
   * Busca activos en un proyecto (V2)
   */
  getAssets: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ASSETS_V2_URL}/projects/${projectId}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Assets:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene categorías de activos
   */
  getCategories: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene estados de activos
   */
  getAssetStatuses: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/asset-statuses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
  
  /**
   * Obtiene atributos personalizados de activos
   */
  getCustomAttributes: async (token: string, projectId: string) => {
    try {
        const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/custom-attributes`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
  }
};