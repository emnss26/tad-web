import axios from 'axios';
import { config } from '../../config';

// Base URLs derived from environment configuration
const MODEL_SET_URL = `${config.aps.baseUrl}/bim360/modelset/v3`;
const CLASH_URL = `${config.aps.baseUrl}/bim360/clash/v3`;

export const Bim360ModelCoordinationLib = {

  // ==========================================
  // SECTION: MODEL SETS
  // ==========================================

  /**
   * Retrieves a list of Model Sets in a container.
   * Note: This API uses 'pageLimit' and 'continuationToken' for pagination.
   * Endpoint: GET /containers/{containerId}/modelsets
   */
  getModelSets: async (token: string, containerId: string, filters?: any) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Model Sets:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves a specific Model Set by ID.
   * Endpoint: GET /containers/{containerId}/modelsets/{modelSetId}
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
   * Retrieves the status of a Model Set Job (useful after creating/updating sets).
   * Endpoint: GET /containers/{containerId}/modelsets/{modelSetId}/jobs/{jobId}
   */
  getModelSetJob: async (token: string, containerId: string, modelSetId: string, jobId: string) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Model Set Job:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves a screenshot associated with a view.
   * Endpoint: GET /containers/{containerId}/modelsets/{modelSetId}/screenshots/{screenShotId}
   */
  getScreenshot: async (token: string, containerId: string, modelSetId: string, screenshotId: string) => {
    try {
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
  // SECTION: VERSIONS
  // ==========================================

  /**
   * Retrieves a list of versions for a Model Set.
   * Endpoint: GET /containers/{containerId}/modelsets/{modelSetId}/versions
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
   * Retrieves the latest version of a Model Set.
   * Endpoint: GET /containers/{containerId}/modelsets/{modelSetId}/versions/latest
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
  // SECTION: CLASH TESTS
  // ==========================================

  /**
   * Retrieves clash test summaries for a Model Set.
   * Endpoint: GET /containers/{containerId}/modelsets/{modelSetId}/tests
   */
  getModelSetTests: async (token: string, containerId: string, modelSetId: string, filters?: any) => {
    try {
      const response = await axios.get(`${CLASH_URL}/containers/${containerId}/modelsets/${modelSetId}/tests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Clash Tests:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves clash test summaries for a specific version.
   * Endpoint: GET /containers/{containerId}/modelsets/{modelSetId}/versions/{version}/tests
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
   * Retrieves details of a specific Clash Test.
   * Endpoint: GET /containers/{containerId}/tests/{testId}
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
   * Retrieves resources (result files) for a Clash Test.
   * Returns signed URLs to download JSON/GZIP clash data.
   * Endpoint: GET /containers/{containerId}/tests/{testId}/resources
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