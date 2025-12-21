import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URL derived from environment configuration
const ISSUES_URL = `${config.aps.baseUrl}/construction/issues/v1`;

export const AccIssuesLib = {

  // ==========================================
  // SECTION: ISSUES
  // ==========================================

  /**
   * Retrieves all issues from a project.
   * Supports automatic pagination to fetch the complete list.
   * Endpoint: GET /projects/{projectId}/issues
   */
  getIssues: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ISSUES_URL}/projects/${projectId}/issues`,
      token,
      filters
    );
  },

  /**
   * Retrieves detailed information about a specific issue.
   * Endpoint: GET /projects/{projectId}/issues/{issueId}
   */
  getIssueDetail: async (token: string, projectId: string, issueId: string) => {
    try {
      const response = await axios.get(`${ISSUES_URL}/projects/${projectId}/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECTION: CONFIGURATION (Types & Attributes)
  // ==========================================

  /**
   * Retrieves the project's issue categories and types.
   * Endpoint: GET /projects/{projectId}/issue-types
   * @param includeSubtypes If true (default), returns subtypes (Types in UI).
   */
  getIssueTypes: async (token: string, projectId: string, includeSubtypes: boolean = true) => {
    try {
      const params: any = {};
      if (includeSubtypes) {
        params.include = 'subtypes';
      }

      const response = await axios.get(`${ISSUES_URL}/projects/${projectId}/issue-types`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Types:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves definitions of issue custom attributes.
   * Endpoint: GET /projects/{projectId}/issue-attribute-definitions
   */
  getAttributeDefinitions: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ISSUES_URL}/projects/${projectId}/issue-attribute-definitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Attribute Definitions:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves the mapping of attributes to issue types/categories.
   * Endpoint: GET /projects/{projectId}/issue-attribute-mappings
   */
  getAttributeMappings: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ISSUES_URL}/projects/${projectId}/issue-attribute-mappings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Issue Attribute Mappings:', error.response?.data || error.message);
      throw error;
    }
  }
};