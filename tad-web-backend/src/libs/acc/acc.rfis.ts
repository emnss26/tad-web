import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URLs derived from environment configuration
const RFIS_V3_URL = `${config.aps.baseUrl}/construction/rfis/v3`;
const BIM360_V2_URL = `${config.aps.baseUrl}/bim360/rfis/v2`;

export const AccRfisLib = {
  
  // ==========================================
  // SECTION: RFI LIST (Via BIM 360 V2 API)
  // ==========================================

  /**
   * Retrieves the list of RFIs using the BIM 360 V2 endpoint (ACC Compatible).
   * Supports automatic pagination to fetch the complete list.
   * Note: This usually requires the RFI Container ID, but often the Project ID works 
   * in hybrid integrations. If it fails, the container ID must be looked up first.
   * Endpoint: GET /bim360/rfis/v2/containers/{containerId}/rfis
   */
  getRfis: async (token: string, projectId: string, filters?: any) => {
    // We use the Helper because V2 API supports limit/offset
    return await PaginationHelper.fetchLimitOffset(
      `${BIM360_V2_URL}/containers/${projectId}/rfis`,
      token,
      filters
    );
  },

  // ==========================================
  // SECTION: DETAILS & CONFIGURATION (ACC V3 API)
  // ==========================================

  /**
   * Retrieves details of a specific RFI.
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
   * Retrieves the current and next available custom identifier.
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
   * Retrieves the workflow configuration for the project.
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
   * Retrieves configured RFI types.
   * Endpoint: GET /projects/{projectId}/rfi-types
   */
  getRfiTypes: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${RFIS_V3_URL}/projects/${projectId}/rfi-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching RFI Types:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves RFI custom attributes.
   * Endpoint: GET /projects/{projectId}/attributes
   */
  getCustomAttributes: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${RFIS_V3_URL}/projects/${projectId}/attributes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching RFI Custom Attributes:', error.response?.data || error.message);
      throw error;
    }
  }
};