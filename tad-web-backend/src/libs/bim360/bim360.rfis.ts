import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URL derived from environment configuration
const RFIS_V2_URL = `${config.aps.baseUrl}/bim360/rfis/v2`;

export const Bim360RfisLib = {

  // ==========================================
  // SECTION: RFIs (V2)
  // ==========================================

  /**
   * Retrieves a list of RFIs from a specific container.
   * Supports automatic pagination to fetch the complete list.
   * Endpoint: GET /containers/{containerId}/rfis
   */
  getRfis: async (token: string, containerId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${RFIS_V2_URL}/containers/${containerId}/rfis`,
      token,
      filters
    );
  },

  /**
   * Retrieves detailed information about a single RFI.
   * Endpoint: GET /containers/{containerId}/rfis/{rfiId}
   */
  getRfiDetail: async (token: string, containerId: string, rfiId: string) => {
    try {
      const response = await axios.get(`${RFIS_V2_URL}/containers/${containerId}/rfis/${rfiId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching RFI Detail:', error.response?.data || error.message);
      throw error;
    }
  }
};