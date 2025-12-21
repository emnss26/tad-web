import axios from 'axios';

const ADMIN_API_URL = 'https://developer.api.autodesk.com/construction/admin/v1';
const HQ_API_URL = 'https://developer.api.autodesk.com/hq/v1';

export const AccAdminLib = {
  
  // ==========================================
  // SECCIÓN: PROYECTOS (Projects)
  // ==========================================

  /**
   * Obtiene la lista de proyectos de una cuenta (ACC y BIM360)
   * Endpoint: GET /accounts/{accountId}/projects
   */
  getAccountProjects: async (token: string, accountId: string, filter?: any) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/accounts/${accountId}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filter
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching ACC Projects:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene detalles de un proyecto específico
   * Endpoint: GET /projects/{projectId}
   */
  getProjectDetails: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Project Details:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECCIÓN: USUARIOS (Users)
  // ==========================================

  /**
   * Obtiene usuarios de un proyecto específico (Filtrado)
   * Endpoint: GET /projects/{projectId}/users
   */
  getProjectUsers: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/projects/${projectId}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Project Users:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene detalles de un usuario específico en el proyecto
   * Endpoint: GET /projects/{projectId}/users/{userId}
   */
  getProjectUserDetail: async (token: string, projectId: string, userId: string) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/projects/${projectId}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Project User Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene todos los usuarios de la cuenta (HQ API)
   * Endpoint: GET /accounts/{account_id}/users
   */
  getAccountUsers: async (token: string, accountId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Account Users:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECCIÓN: EMPRESAS (Companies)
  // ==========================================

  /**
   * Obtiene la lista de empresas en una cuenta
   * Endpoint: GET /accounts/{accountId}/companies
   */
  getAccountCompanies: async (token: string, accountId: string, filter?: any) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/accounts/${accountId}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filter
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Account Companies:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el detalle de una empresa específica
   * Endpoint: GET /hq/v1/accounts/:account_id/companies/:company_id
   */
  getCompanyDetails: async (token: string, accountId: string, companyId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Company Details:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene todas las empresas asociadas a un proyecto específico
   * Endpoint: GET /hq/v1/accounts/:account_id/projects/:project_id/companies
   */
  getProjectCompanies: async (token: string, accountId: string, projectId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/projects/${projectId}/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Project Companies:', error.response?.data || error.message);
      throw error;
    }
  }
};