import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URL derived from environment configuration
const ISSUES_V2_URL = `${config.aps.baseUrl}/issues/v2`;

export const Bim360IssuesLib = {

  // ==========================================
  // SECTION: ATTRIBUTES & MAPPINGS
  // ==========================================

  /**
   * Retrieves information about issue custom attributes for a project (Container).
   * Endpoint: GET /containers/{containerId}/issue-attribute-definitions
   */
  getAttributeDefinitions: async (token: string, containerId: string) => {
    try {
      const response = await axios.get(`${ISSUES_V2_URL}/containers/${containerId}/issue-attribute-definitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Attribute Defs:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves information about issue custom attributes assigned to categories/types.
   * Endpoint: GET /containers/{containerId}/issue-attribute-mappings
   */
  getAttributeMappings: async (token: string, containerId: string) => {
    try {
      const response = await axios.get(`${ISSUES_V2_URL}/containers/${containerId}/issue-attribute-mappings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Attribute Mappings:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECTION: ISSUES (V2)
  // ==========================================

  /**
   * Retrieves information about all issues in a project (Container).
   * Supports automatic pagination to fetch the complete list.
   * Endpoint: GET /containers/{containerId}/issues
   */
  getIssues: async (token: string, containerId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ISSUES_V2_URL}/containers/${containerId}/issues`,
      token,
      filters
    );
  },

  /**
   * Retrieves detailed information about a single issue.
   * Endpoint: GET /containers/{containerId}/issues/{issueId}
   */
  getIssueDetail: async (token: string, containerId: string, issueId: string) => {
    try {
      const response = await axios.get(`${ISSUES_V2_URL}/containers/${containerId}/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Detail:', error.response?.data || error.message);
      throw error;
    }
  }
};