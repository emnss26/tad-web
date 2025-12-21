import axios from 'axios';

const SUBMITTALS_URL = 'https://developer.api.autodesk.com/construction/submittals/v2';

export const AccSubmittalsLib = {
  
  // ==========================================
  // ITEMS (Elementos de Submittal)
  // ==========================================

  /**
   * Obtiene lista de items de Submittals
   * Endpoint: GET /projects/:projectId/items
   */
  getItems: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/items`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Submittals:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el detalle de un item específico
   * Endpoint: GET /projects/:projectId/items/:itemId
   */
  getItemDetail: async (token: string, projectId: string, itemId: string) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Submittal Item Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene historial de revisiones de un item
   * Endpoint: GET /projects/:projectId/items/:itemId/revisions
   */
  getItemRevisions: async (token: string, projectId: string, itemId: string) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/items/${itemId}/revisions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Item Revisions:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene tipos de items (Categorías como Attic Stock, Sample, etc.)
   * Endpoint: GET /projects/:projectId/item-types
   */
  getItemTypes: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/item-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // ==========================================
  // SPECS (Secciones de Especificaciones)
  // ==========================================

  /**
   * Obtiene todas las secciones de especificaciones del proyecto
   * Endpoint: GET /projects/:projectId/specs
   */
  getSpecs: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/specs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Specs:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el detalle de una sección de especificación específica
   * Endpoint: GET /projects/:projectId/specs/:id
   */
  getSpecDetail: async (token: string, projectId: string, specId: string) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/specs/${specId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Spec Detail:', error.response?.data || error.message);
      throw error;
    }
  }
};