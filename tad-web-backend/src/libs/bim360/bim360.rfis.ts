import axios from 'axios';

const RFIS_V2_URL = 'https://developer.api.autodesk.com/bim360/rfis/v2';

export const Bim360RfisLib = {
  getRfis: async (token: string, containerId: string, filters?: any) => {
    try {
      const response = await axios.get(`${RFIS_V2_URL}/containers/${containerId}/rfis`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching BIM360 RFIs:', error.response?.data || error.message);
      throw error;
    }
  },

  getRfiDetail: async (token: string, containerId: string, rfiId: string) => {
    try {
      const response = await axios.get(`${RFIS_V2_URL}/containers/${containerId}/rfis/${rfiId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};