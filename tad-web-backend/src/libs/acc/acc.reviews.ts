import axios from 'axios';

const REVIEWS_URL = 'https://developer.api.autodesk.com/construction/reviews/v1';

export const AccReviewsLib = {
  
  // ==========================================
  // WORKFLOWS (Flujos de Aprobación)
  // ==========================================

  /**
   * Obtiene todos los flujos de trabajo de aprobación del proyecto
   * Endpoint: GET /projects/{projectId}/workflows
   */
  getWorkflows: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/workflows`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Workflows:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene un flujo de trabajo específico por ID
   * Endpoint: GET /projects/{projectId}/workflows/{workflowId}
   */
  getWorkflowDetail: async (token: string, projectId: string, workflowId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/workflows/${workflowId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Workflow Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // REVIEWS (Revisiones)
  // ==========================================

  /**
   * Obtiene la lista de revisiones en el proyecto
   * Endpoint: GET /projects/{projectId}/reviews
   */
  getReviews: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Reviews:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene detalles de una revisión específica
   * Endpoint: GET /projects/{projectId}/reviews/{reviewId}
   */
  getReviewDetail: async (token: string, projectId: string, reviewId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene la estructura del flujo de trabajo asociado a una revisión específica
   * Endpoint: GET /projects/{projectId}/reviews/{reviewId}/workflow
   */
  getReviewWorkflow: async (token: string, projectId: string, reviewId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/reviews/${reviewId}/workflow`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Workflow:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el progreso histórico de una revisión (quién aprobó, cuándo, etc.)
   * Endpoint: GET /projects/{projectId}/reviews/{reviewId}/progress
   */
  getReviewProgress: async (token: string, projectId: string, reviewId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/reviews/${reviewId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Progress:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene los archivos (versiones) incluidos en la última ronda de revisión
   * Endpoint: GET /projects/{projectId}/reviews/{reviewId}/versions
   */
  getReviewVersions: async (token: string, projectId: string, reviewId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/reviews/${reviewId}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Versions:', error.response?.data || error.message);
      throw error;
    }
  }
};