import axios from 'axios';
import { config } from '../../config';

// Base URL derived from environment configuration
const DOCS_URL = `${config.aps.baseUrl}/bim360/docs/v1`;

export const AccDocsLib = {
  
  // ==========================================
  // SECTION: FOLDER PERMISSIONS
  // ==========================================

  /**
   * Retrieves information about permissions assigned to users, roles, and companies for a folder.
   * Endpoint: GET /projects/{projectId}/folders/{folderId}/permissions
   */
  getFolderPermissions: async (token: string, projectId: string, folderId: string) => {
    try {
      const response = await axios.get(`${DOCS_URL}/projects/${projectId}/folders/${folderId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Folder Permissions:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==========================================
  // SECTION: CUSTOM ATTRIBUTES (Naming Standards / Metadata)
  // ==========================================

  /**
   * Retrieves a complete list of custom attribute definitions for a specific folder.
   * Endpoint: GET /projects/{projectId}/folders/{folderId}/custom-attribute-definitions
   */
  getFolderAttributeDefinitions: async (token: string, projectId: string, folderId: string) => {
    try {
      const response = await axios.get(`${DOCS_URL}/projects/${projectId}/folders/${folderId}/custom-attribute-definitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Attribute Definitions:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Assigns values to custom attributes for multiple documents (Batch Update).
   * Also used to clear custom attribute values.
   * Endpoint: POST /projects/{projectId}/versions/{versionId}/custom-attributes:batch-update
   */
  batchUpdateAttributes: async (token: string, projectId: string, versionId: string, payload: any) => {
    try {
      const response = await axios.post(
        `${DOCS_URL}/projects/${projectId}/versions/${versionId}/custom-attributes:batch-update`,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          } 
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating Custom Attributes:', error.response?.data || error.message);
      throw error;
    }
  }
};