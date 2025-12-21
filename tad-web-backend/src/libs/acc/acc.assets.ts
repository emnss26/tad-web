import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URLs derived from environment configuration
const ASSETS_V2_URL = `${config.aps.baseUrl}/construction/assets/v2`;
const ASSETS_V1_URL = `${config.aps.baseUrl}/construction/assets/v1`;

export const AccAssetsLib = {

  // ==========================================
  // ASSETS (V2)
  // ==========================================

  /**
   * Searches for and returns all specified assets within a project.
   * Supports automatic pagination to fetch all results.
   * Endpoint: GET /projects/{projectId}/assets
   */
  getAssets: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ASSETS_V2_URL}/projects/${projectId}/assets`,
      token,
      filters
    );
  },

  // ==========================================
  // SETTINGS & METADATA (V1)
  // ==========================================

  /**
   * Retrieves all categories within a project.
   * Note: This endpoint does not support pagination requests; it returns all categories.
   * Endpoint: GET /projects/{projectId}/categories
   */
  getCategories: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Return the 'results' array if present, otherwise the data itself
      return response.data.results || response.data;
    } catch (error: any) {
      console.error('Error fetching Asset Categories:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves all asset statuses.
   * Supports automatic pagination.
   * Endpoint: GET /projects/{projectId}/asset-statuses
   */
  getAssetStatuses: async (token: string, projectId: string) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ASSETS_V1_URL}/projects/${projectId}/asset-statuses`,
      token
    );
  },

  /**
   * Retrieves all custom attributes definitions.
   * Supports automatic pagination.
   * Endpoint: GET /projects/{projectId}/custom-attributes
   */
  getCustomAttributes: async (token: string, projectId: string) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ASSETS_V1_URL}/projects/${projectId}/custom-attributes`,
      token
    );
  }
};