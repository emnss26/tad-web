import axios from 'axios';

const RFIS_V3_URL = 'https://developer.api.autodesk.com/construction/rfis/v3';
const BIM360_V2_URL = 'https://developer.api.autodesk.com/bim360/rfis/v2';

export const AccRfisLib = {
  
  // ==========================================
  // LISTADO DE RFIs (Vía BIM 360 V2 API)
  // ==========================================

  /**
   * Obtiene la lista de RFIs usando el endpoint de BIM 360 V2 (Compatible con ACC).
   * Nota: Requiere el ID del Contenedor de RFIs (A veces es el mismo ProjectId, o se busca en el perfil del proyecto).
   * Endpoint: GET /bim360/rfis/v2/containers/:containerId/rfis
   */
  getRfis: async (token: string, projectId: string, filters?: any) => {
    try {
      // Nota: En muchas integraciones híbridas, se usa el projectId directamente como containerId
      // Si falla, se debería buscar primero el "rfiContainerId" del proyecto.
      const response = await axios.get(`${BIM360_V2_URL}/containers/${projectId}/rfis`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters // Soporta limit, offset, sort, etc.
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching RFIs list (V2):', error.response?.data || error.message);
      // Retornamos array vacío si no hay datos para evitar romper el frontend
      return { data: [], pagination: {} }; 
    }
  },

  // ==========================================
  // DETALLES Y CONFIGURACIÓN (ACC V3 API)
  // ==========================================

  /**
   * Obtiene detalles de un RFI específico
   * Endpoint: GET /projects/{projectId}/rfis/{rfiId}
   */
  getRfiDetail: async (token: string, projectId: string, rfiId: string) => {
    try {
      const response = await axios.get(`${RFIS_V3_URL}/projects/${projectId}/rfis/${rfiId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching RFI Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el identificador personalizado actual y el siguiente disponible
   * Endpoint: GET /projects/{projectId}/rfis/custom-identifier
   */
  getCustomIdentifier: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${RFIS_V3_URL}/projects/${projectId}/rfis/custom-identifier`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Custom Identifier:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene la configuración del flujo de trabajo (Workflow) del proyecto
   * Endpoint: GET /projects/{projectId}/workflow
   */
  getProjectWorkflow: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${RFIS_V3_URL}/projects/${projectId}/workflow`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching RFI Workflow:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene tipos de RFI configurados
   * Endpoint: GET /projects/{projectId}/rfi-types
   */
  getRfiTypes: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${RFIS_V3_URL}/projects/${projectId}/rfi-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene atributos personalizados de RFIs
   * Endpoint: GET /projects/{projectId}/attributes
   */
  getCustomAttributes: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${RFIS_V3_URL}/projects/${projectId}/attributes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};