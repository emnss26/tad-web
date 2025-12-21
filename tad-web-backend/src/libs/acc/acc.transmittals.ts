import axios from 'axios';

const TRANSMITTALS_URL = 'https://developer.api.autodesk.com/construction/transmittals/v1';

export const AccTransmittalsLib = {
  /**
   * Obtiene todos los transmittals del proyecto
   * Endpoint: GET /projects/{projectId}/transmittals
   */
  getTransmittals: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${TRANSMITTALS_URL}/projects/${projectId}/transmittals`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Transmittals:', error.response?.data || error.message);
      throw error;
    }
  }
};