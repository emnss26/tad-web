import axios from 'axios';

const ASSETS_V1_URL = 'https://developer.api.autodesk.com/bim360/assets/v1';
const ASSETS_V2_URL = 'https://developer.api.autodesk.com/bim360/assets/v2';

export const Bim360AssetsLib = {
  getAssets: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ASSETS_V2_URL}/projects/${projectId}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching BIM360 Assets:', error.response?.data || error.message);
      throw error;
    }
  },

  getCategories: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getStatuses: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/asset-statuses`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getCustomAttributes: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/custom-attributes`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getCategoryAttributes: async (token: string, projectId: string, categoryId: string) => {
    try {
      const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/categories/${categoryId}/custom-attributes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};