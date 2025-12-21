import axios from 'axios';

const ISSUES_URL = 'https://developer.api.autodesk.com/construction/issues/v1';

export const AccIssuesLib = {
  /**
   * Obtiene la lista de Issues del proyecto (con filtros opcionales)
   * Endpoint: GET /projects/{projectId}/issues
   */
  getIssues: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ISSUES_URL}/projects/${projectId}/issues`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issues:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el detalle de un Issue específico
   * Endpoint: GET /projects/{projectId}/issues/{issueId}
   */
  getIssueDetail: async (token: string, projectId: string, issueId: string) => {
    try {
      const response = await axios.get(`${ISSUES_URL}/projects/${projectId}/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene los tipos y categorías de Issues del proyecto
   * Endpoint: GET /projects/{projectId}/issue-types
   * @param includeSubtypes Si es true (por defecto), trae también los subtipos (Types en la UI)
   */
  getIssueTypes: async (token: string, projectId: string, includeSubtypes: boolean = true) => {
    try {
      const params: any = {};
      if (includeSubtypes) {
        params.include = 'subtypes';
      }

      const response = await axios.get(`${ISSUES_URL}/projects/${projectId}/issue-types`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Types:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene definiciones de atributos personalizados de Issues
   * Endpoint: GET /projects/{projectId}/issue-attribute-definitions
   */
  getAttributeDefinitions: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ISSUES_URL}/projects/${projectId}/issue-attribute-definitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Attribute Definitions:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el mapeo de atributos (qué atributos aplican a qué tipos/categorías)
   * Endpoint: GET /projects/{projectId}/issue-attribute-mappings
   */
  getAttributeMappings: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ISSUES_URL}/projects/${projectId}/issue-attribute-mappings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Attribute Mappings:', error.response?.data || error.message);
      throw error;
    }
  }
};