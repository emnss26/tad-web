import { config } from '../../config';
import { PaginationHelper } from '../../utils/general/pagination.helper';

// Base URL derived from environment configuration
const TRANSMITTALS_URL = `${config.aps.baseUrl}/construction/transmittals/v1`;

export const AccTransmittalsLib = {
  
  // ==========================================
  // SECTION: TRANSMITTALS
  // ==========================================

  /**
   * Retrieves all transmittals for a specific project.
   * Supports automatic pagination to fetch the complete list.
   * Endpoint: GET /projects/{projectId}/transmittals
   */
  getTransmittals: async (token: string, projectId: string, filters?: any) => {
    return await PaginationHelper.fetchLimitOffset(
      `${TRANSMITTALS_URL}/projects/${projectId}/transmittals`,
      token,
      filters
    );
  }
};