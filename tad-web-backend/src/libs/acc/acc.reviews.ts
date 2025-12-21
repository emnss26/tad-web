import axios from 'axios';
import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URL derived from environment configuration
const REVIEWS_URL = `${config.aps.baseUrl}/construction/reviews/v1`;

export const AccReviewsLib = {
  
  // ==========================================
  // SECTION: WORKFLOWS
  // ==========================================

  /**
   * Retrieves all approval workflows configured for the project.
   * Endpoint: GET /projects/{projectId}/workflows
   */
  getWorkflows: async (token: string, projectId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/workflows`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Workflows:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves a specific approval workflow by ID.
   * Endpoint: GET /projects/{projectId}/workflows/{workflowId}
   */
  getWorkflowDetail: async (token: string, projectId: string, workflowId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/workflows/${workflowId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Workflow Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECTION: REVIEWS
  // ==========================================

  /**
   * Retrieves the list of reviews in the project.
   * Supports automatic pagination to fetch all reviews.
   * Endpoint: GET /projects/{projectId}/reviews
   */
  getReviews: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${REVIEWS_URL}/projects/${projectId}/reviews`,
      token,
      filters
    );
  },

  /**
   * Retrieves details of a specific review.
   * Endpoint: GET /projects/{projectId}/reviews/{reviewId}
   */
  getReviewDetail: async (token: string, projectId: string, reviewId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Detail:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves the workflow structure associated with a specific review.
   * Endpoint: GET /projects/{projectId}/reviews/{reviewId}/workflow
   */
  getReviewWorkflow: async (token: string, projectId: string, reviewId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/reviews/${reviewId}/workflow`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Workflow:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves the historical progress of a review (approvals, dates, etc.).
   * Endpoint: GET /projects/{projectId}/reviews/{reviewId}/progress
   */
  getReviewProgress: async (token: string, projectId: string, reviewId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/reviews/${reviewId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Progress:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieves the file versions included in the latest review round.
   * Endpoint: GET /projects/{projectId}/reviews/{reviewId}/versions
   */
  getReviewVersions: async (token: string, projectId: string, reviewId: string) => {
    try {
      const response = await axios.get(`${REVIEWS_URL}/projects/${projectId}/reviews/${reviewId}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Review Versions:', error.response?.data || error.message);
      throw error;
    }
  }
};