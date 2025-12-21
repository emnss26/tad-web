import axios from 'axios';

const ADMIN_API_URL = 'https://developer.api.autodesk.com/construction/admin/v1';
const HQ_API_URL = 'https://developer.api.autodesk.com/hq/v1';

export const Bim360AdminLib = {
  // --- PROYECTOS ---
  getProjects: async (token: string, accountId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/accounts/${accountId}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching BIM360 Projects:', error.response?.data || error.message);
      throw error;
    }
  },

  getProjectDetail: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // --- EMPRESAS (HQ API) ---
  getCompanyDetail: async (token: string, accountId: string, companyId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getProjectCompanies: async (token: string, accountId: string, projectId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/projects/${projectId}/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // --- USUARIOS (HQ & ADMIN) ---
  getAccountUsers: async (token: string, accountId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getAccountUserDetail: async (token: string, accountId: string, userId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getProjectUsers: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/projects/${projectId}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getProjectUserDetail: async (token: string, projectId: string, userId: string) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/projects/${projectId}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};