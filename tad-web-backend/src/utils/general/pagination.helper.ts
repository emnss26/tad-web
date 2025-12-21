import axios from 'axios';

/**
 * Utility to handle API pagination strategies.
 * Centralizes the logic to fetch all records from paginated endpoints.
 */
export const PaginationHelper = {

  /**
   * Fetches all resources using the 'limit' and 'offset' strategy.
   * Common in ACC Admin, HQ, Issues, and BIM 360 APIs.
   * * @param url The full API endpoint URL.
   * @param token The OAuth access token.
   * @param params Optional query parameters (filters).
   * @returns A Promise resolving to an array containing all items.
   */
  fetchLimitOffset: async <T = any>(url: string, token: string, params: any = {}): Promise<T[]> => {
    let allResults: T[] = [];
    let offset = 0;
    const limit = 100; // Maximum allowed by most Autodesk APIs
    let hasMore = true;

    try {
      while (hasMore) {
        // console.log(`[Pagination] Fetching ${url} | Offset: ${offset}`); // Debug if needed

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          params: { ...params, limit, offset }
        });

        // Determine where the array is located in the response
        const responseData = response.data;
        let items: T[] = [];

        if (Array.isArray(responseData)) {
          items = responseData;
        } else if (responseData.results && Array.isArray(responseData.results)) {
          items = responseData.results;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          items = responseData.data;
        }

        allResults = [...allResults, ...items];

        // Check if we reached the end
        if (items.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }

      return allResults;

    } catch (error: any) {
      // Enhance error message with context
      console.error(`Pagination Error [${url}]:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * FUTURE: Placeholder for Data Management pagination (JSON API Links).
   * We will implement this when refactoring Data Management libs.
   */
  fetchJsonApiLinks: async () => {
    // To be implemented...
  }
};