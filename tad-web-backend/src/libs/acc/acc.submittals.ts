import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URL derived from environment configuration
const SUBMITTALS_URL = `${config.aps.baseUrl}/construction/submittals/v2`;

export const AccSubmittalsLib = {
  
  // ==========================================
  // SECTION: ITEMS (Submittal Items)
  // ==========================================

  /**
   * Retrieves a list of submittal items.
   * Supports automatic pagination to fetch the complete list.
   * Endpoint: GET /projects/{projectId}/items
   */
  getItems: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${SUBMITTALS_URL}/projects/${projectId}/items`,
      token,
      filters
    );
  },

  /**
   * Retrieves details of a specific submittal item.
   * Endpoint: GET /projects/{projectId}/items/{itemId}
   */
  getItemDetail: async (token: string, projectId: string, itemId: string) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Submittal Item Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves the revision history of a specific item.
   * Endpoint: GET /projects/{projectId}/items/{itemId}/revisions
   */
  getItemRevisions: async (token: string, projectId: string, itemId: string) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/items/${itemId}/revisions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Item Revisions:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves available item types (e.g., Attic Stock, Sample).
   * Endpoint: GET /projects/{projectId}/item-types
   */
  getItemTypes: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/item-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Item Types:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECTION: SPECS (Specification Sections)
  // ==========================================

  /**
   * Retrieves all specification sections for the project.
   * Supports automatic pagination.
   * Endpoint: GET /projects/{projectId}/specs
   */
  getSpecs: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${SUBMITTALS_URL}/projects/${projectId}/specs`,
      token,
      filters
    );
  },

  /**
   * Retrieves details of a specific specification section.
   * Endpoint: GET /projects/{projectId}/specs/{id}
   */
  getSpecDetail: async (token: string, projectId: string, specId: string) => {
    try {
      const response = await axios.get(`${SUBMITTALS_URL}/projects/${projectId}/specs/${specId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Spec Detail:', error.response?.data || error.message);
      throw error;
    }
  }
};