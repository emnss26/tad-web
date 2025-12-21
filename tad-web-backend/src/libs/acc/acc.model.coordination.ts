import axios from 'axios';

const MODEL_SET_URL = 'https://developer.api.autodesk.com/bim360/modelset/v3';
const CLASH_URL = 'https://developer.api.autodesk.com/bim360/clash/v3';

export const AccModelCoordinationLib = {

  // ==========================================
  // MODEL SETS (Conjuntos de Modelos)
  // ==========================================

  /**
   * Obtiene la lista de Model Sets en un contenedor.
   * Endpoint: GET /containers/:containerId/modelsets
   */
  getModelSets: async (token: string, containerId: string, filters?: any) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters // Soporta pageLimit, offset, etc.
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Model Sets:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene un Model Set específico por ID.
   * Endpoint: GET /containers/:containerId/modelsets/:modelSetId
   */
  getModelSetDetail: async (token: string, containerId: string, modelSetId: string) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Model Set Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el estado de un trabajo (Job) del Model Set (útil tras crear/actualizar sets).
   * Endpoint: GET /containers/:containerId/modelsets/:modelSetId/jobs/:jobId
   */
  getModelSetJob: async (token: string, containerId: string, modelSetId: string, jobId: string) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Job Status:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene una captura de pantalla (screenshot) asociada a una vista.
   * Endpoint: GET /containers/:containerId/modelsets/:modelSetId/screenshots/:screenShotId
   */
  getScreenshot: async (token: string, containerId: string, modelSetId: string, screenshotId: string) => {
    try {
      // Nota: Si esto devuelve una imagen binaria, se debería ajustar responseType a 'arraybuffer' o 'stream'
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}/screenshots/${screenshotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Screenshot:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // VERSIONS (Versiones del Model Set)
  // ==========================================

  /**
   * Obtiene la lista de versiones de un Model Set.
   * Endpoint: GET /containers/:containerId/modelsets/:modelSetId/versions
   */
  getModelSetVersions: async (token: string, containerId: string, modelSetId: string, filters?: any) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Model Set Versions:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene la última versión de un Model Set.
   * Endpoint: GET /containers/:containerId/modelsets/:modelSetId/versions/latest
   */
  getLatestVersion: async (token: string, containerId: string, modelSetId: string) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}/versions/latest`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Latest Version:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // CLASH TESTS (Pruebas de Conflicto)
  // ==========================================

  /**
   * Obtiene los resúmenes de Clash Tests para un Model Set completo.
   * Endpoint: GET /containers/:containerId/modelsets/:modelSetId/tests
   */
  getModelSetTests: async (token: string, containerId: string, modelSetId: string, filters?: any) => {
    try {
      const response = await axios.get(`${CLASH_URL}/containers/${containerId}/modelsets/${modelSetId}/tests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Model Set Tests:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene los resúmenes de Clash Tests para una versión específica.
   * Endpoint: GET /containers/:containerId/modelsets/:modelSetId/versions/:version/tests
   */
  getModelSetVersionTests: async (token: string, containerId: string, modelSetId: string, version: string, filters?: any) => {
    try {
      const response = await axios.get(`${CLASH_URL}/containers/${containerId}/modelsets/${modelSetId}/versions/${version}/tests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Version Tests:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el detalle de un Test de Conflicto específico.
   * Endpoint: GET /containers/:containerId/tests/:testId
   */
  getClashTestDetail: async (token: string, containerId: string, testId: string) => {
    try {
      const response = await axios.get(`${CLASH_URL}/containers/${containerId}/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Clash Test Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene los recursos (archivos de resultados) de un Test.
   * Devuelve URLs firmadas para descargar el JSON/GZIP con los conflictos.
   * Endpoint: GET /containers/:containerId/tests/:testId/resources
   */
  getClashTestResources: async (token: string, containerId: string, testId: string) => {
    try {
      const response = await axios.get(`${CLASH_URL}/containers/${containerId}/tests/${testId}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Clash Test Resources:', error.response?.data || error.message);
      throw error;
    }
  }
};