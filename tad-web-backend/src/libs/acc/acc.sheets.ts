import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URL derived from environment configuration
const SHEETS_URL = `${config.aps.baseUrl}/construction/sheets/v1`;

export const AccSheetsLib = {
  
  // ==========================================
  // SECTION: VERSION SETS
  // ==========================================

  /**
   * Retrieves the list of version sets for a project.
   * Endpoint: GET /projects/{projectId}/version-sets
   */
  getVersionSets: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${SHEETS_URL}/projects/${projectId}/version-sets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Version Sets:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECTION: SHEETS
  // ==========================================

  /**
   * Retrieves information about sheets in a project.
   * Supports automatic pagination to fetch the complete list.
   * Endpoint: GET /projects/{projectId}/sheets
   */
  getSheets: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${SHEETS_URL}/projects/${projectId}/sheets`,
      token,
      filters
    );
  }
};