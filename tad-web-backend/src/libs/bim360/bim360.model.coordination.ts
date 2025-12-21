import axios from 'axios';

const MODEL_SET_URL = 'https://developer.api.autodesk.com/bim360/modelset/v3';
const CLASH_URL = 'https://developer.api.autodesk.com/bim360/clash/v3';

export const Bim360ModelCoordinationLib = {
  
  // --- MODEL SETS ---
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

  getModelSetDetail: async (token: string, containerId: string, modelSetId: string) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getModelSetJob: async (token: string, containerId: string, modelSetId: string, jobId: string) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getScreenshot: async (token: string, containerId: string, modelSetId: string, screenshotId: string) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}/screenshots/${screenshotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // --- VERSIONS ---
  getModelSetVersions: async (token: string, containerId: string, modelSetId: string, filters?: any) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getLatestVersion: async (token: string, containerId: string, modelSetId: string) => {
    try {
      const response = await axios.get(`${MODEL_SET_URL}/containers/${containerId}/modelsets/${modelSetId}/versions/latest`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // --- CLASH TESTS ---
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

  getModelSetVersionTests: async (token: string, containerId: string, modelSetId: string, version: string, filters?: any) => {
    try {
      const response = await axios.get(`${CLASH_URL}/containers/${containerId}/modelsets/${modelSetId}/versions/${version}/tests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getClashTestDetail: async (token: string, containerId: string, testId: string) => {
    try {
      const response = await axios.get(`${CLASH_URL}/containers/${containerId}/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getClashTestResources: async (token: string, containerId: string, testId: string) => {
    try {
      const response = await axios.get(`${CLASH_URL}/containers/${containerId}/tests/${testId}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};