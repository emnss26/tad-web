import axios from 'axios';

const ISSUES_V2_URL = 'https://developer.api.autodesk.com/issues/v2';

export const Bim360IssuesLib = {
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

  getAttributeMappings: async (token: string, containerId: string) => {
    try {
      const response = await axios.get(`${ISSUES_V2_URL}/containers/${containerId}/issue-attribute-mappings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getIssues: async (token: string, containerId: string, filters?: any) => {
    try {
      const response = await axios.get(`${ISSUES_V2_URL}/containers/${containerId}/issues`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching BIM360 Issues:', error.response?.data || error.message);
      throw error;
    }
  },

  getIssueDetail: async (token: string, containerId: string, issueId: string) => {
    try {
      const response = await axios.get(`${ISSUES_V2_URL}/containers/${containerId}/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};