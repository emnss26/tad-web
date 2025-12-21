import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URLs derived from environment configuration
const ASSETS_V1_URL = `${config.aps.baseUrl}/bim360/assets/v1`;
const ASSETS_V2_URL = `${config.aps.baseUrl}/bim360/assets/v2`;

export const Bim360AssetsLib = {

  // ==========================================
  // SECTION: ASSETS (V2)
  // ==========================================

  /**
   * Searches for and returns all specified assets within a project.
   * Supports automatic pagination to fetch the complete list.
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
  // SECTION: SETTINGS & METADATA (V1)
  // ==========================================

  /**
   * Searches for and returns all specified categories.
   * Note: This endpoint does not support pagination in requests (returns all).
   * Endpoint: GET /projects/{projectId}/categories
   */
  getCategories: async (token: string, projectId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Asset Categories:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Searches for and returns all specified asset statuses.
   * Supports automatic pagination.
   * Endpoint: GET /projects/{projectId}/asset-statuses
   */
  getStatuses: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ASSETS_V1_URL}/projects/${projectId}/asset-statuses`,
      token,
      filters
    );
  },

  /**
   * Searches for and returns all specified custom attributes.
   * Supports automatic pagination.
   * Endpoint: GET /projects/{projectId}/custom-attributes
   */
  getCustomAttributes: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ASSETS_V1_URL}/projects/${projectId}/custom-attributes`,
      token,
      filters
    );
  },

  /**
   * Returns the custom attribute assignments for a specified category.
   * Note: This endpoint does not support pagination.
   * Endpoint: GET /projects/{projectId}/categories/{categoryId}/custom-attributes
   */
  getCategoryAttributes: async (token: string, projectId: string, categoryId: string) => {
    try {
      const response = await axios.get(`${ASSETS_V1_URL}/projects/${projectId}/categories/${categoryId}/custom-attributes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Category Attributes:', error.response?.data || error.message);
      throw error;
    }
  }
};