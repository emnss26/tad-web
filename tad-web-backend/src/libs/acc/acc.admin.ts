import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URLs derived from environment configuration
const ADMIN_API_URL = `${config.aps.baseUrl}/construction/admin/v1`;
const HQ_API_URL = `${config.aps.baseUrl}/hq/v1`;

export const AccAdminLib = {

  // ==========================================
  // SECTION: PROJECTS
  // ==========================================

  /**
   * Retrieves the project list for an account (ACC & BIM 360).
   * Automatically handles pagination to return all projects.
   * Endpoint: GET /accounts/{accountId}/projects
   */
  getAccountProjects: async (token: string, accountId: string, filter?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ADMIN_API_URL}/accounts/${accountId}/projects`,
      token,
      filter
    );
  },

  /**
   * Retrieves specific project details.
   * Endpoint: GET /projects/{projectId}
   */
  getProjectDetails: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Project Details:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECTION: USERS
  // ==========================================

  /**
   * Retrieves users from a specific project.
   * Automatically handles pagination.
   * Endpoint: GET /projects/{projectId}/users
   */
  getProjectUsers: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ADMIN_API_URL}/projects/${projectId}/users`,
      token,
      filters
    );
  },

  /**
   * Retrieves details of a specific user in a project.
   * Endpoint: GET /projects/{projectId}/users/{userId}
   */
  getProjectUserDetail: async (token: string, projectId: string, userId: string) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/projects/${projectId}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Project User Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves all users in the account (HQ API).
   * Automatically handles pagination.
   * Endpoint: GET /accounts/{account_id}/users
   */
  getAccountUsers: async (token: string, accountId: string) => {
    return await PaginationHelper.fetchLimitOffset(
      `${HQ_API_URL}/accounts/${accountId}/users`,
      token
    );
  },

  // ==========================================
  // SECTION: COMPANIES
  // ==========================================

  /**
   * Retrieves the list of companies in an account.
   * Automatically handles pagination.
   * Endpoint: GET /accounts/{accountId}/companies
   */
  getAccountCompanies: async (token: string, accountId: string, filter?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ADMIN_API_URL}/accounts/${accountId}/companies`,
      token,
      filter
    );
  },

  /**
   * Retrieves details of a specific company.
   * Endpoint: GET /hq/v1/accounts/:account_id/companies/:company_id
   */
  getCompanyDetails: async (token: string, accountId: string, companyId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Company Details:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves all companies associated with a specific project.
   * Endpoint: GET /hq/v1/accounts/:account_id/projects/:project_id/companies
   */
  getProjectCompanies: async (token: string, accountId: string, projectId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/projects/${projectId}/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Project Companies:', error.response?.data || error.message);
      throw error;
    }
  }
};