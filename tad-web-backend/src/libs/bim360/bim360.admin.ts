import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URLs derived from environment configuration
const ADMIN_API_URL = `${config.aps.baseUrl}/construction/admin/v1`;
const HQ_API_URL = `${config.aps.baseUrl}/hq/v1`;

export const Bim360AdminLib = {

  // ==========================================
  // SECTION: PROJECTS
  // ==========================================

  /**
   * Retrieves a list of projects in the specified account.
   * Supports automatic pagination to fetch the complete list.
   * Endpoint: GET /accounts/{accountId}/projects
   */
  getProjects: async (token: string, accountId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${ADMIN_API_URL}/accounts/${accountId}/projects`,
      token,
      filters
    );
  },

  /**
   * Retrieves details of a specific project.
   * Endpoint: GET /projects/{projectId}
   */
  getProjectDetail: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${ADMIN_API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Project Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECTION: COMPANIES (HQ API)
  // ==========================================

  /**
   * Retrieves details of a specific partner company.
   * Endpoint: GET /hq/v1/accounts/:account_id/companies/:company_id
   */
  getCompanyDetail: async (token: string, accountId: string, companyId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Company Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves all partner companies in a specific project.
   * Supports automatic pagination.
   * Endpoint: GET /hq/v1/accounts/:account_id/projects/:project_id/companies
   */
  getProjectCompanies: async (token: string, accountId: string, projectId: string) => {
    return await PaginationHelper.fetchLimitOffset(
      `${HQ_API_URL}/accounts/${accountId}/projects/${projectId}/companies`,
      token
    );
  },

  // ==========================================
  // SECTION: USERS (HQ & ADMIN API)
  // ==========================================

  /**
   * Retrieves all users in the specific account (HQ API).
   * Supports automatic pagination.
   * Endpoint: GET /hq/v1/accounts/:account_id/users
   */
  getAccountUsers: async (token: string, accountId: string) => {
    return await PaginationHelper.fetchLimitOffset(
      `${HQ_API_URL}/accounts/${accountId}/users`,
      token
    );
  },

  /**
   * Retrieves details of a specific user in the account (HQ API).
   * Endpoint: GET /hq/v1/accounts/:account_id/users/:user_id
   */
  getAccountUserDetail: async (token: string, accountId: string, userId: string) => {
    try {
      const response = await axios.get(`${HQ_API_URL}/accounts/${accountId}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Account User Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves users from a specific project (Admin API).
   * Supports automatic pagination.
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
   * Retrieves detailed information about a specific user in a project.
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
  }
};