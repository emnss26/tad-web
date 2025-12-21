import axios from 'axios';

const AEC_GRAPHQL_URL = 'https://developer.api.autodesk.com/aec/graphql';

export const AecHubsLib = {
  /**
   * Obtiene los Hubs disponibles vía AEC Data Model
   * @param token Token de acceso (3-legged o 2-legged)
   * @param filter Filtros opcionales (ej: { name: "Mi Hub" })
   * @param pagination Paginación opcional (ej: { limit: 10 })
   */
  getHubs: async (token: string, filter?: any, pagination?: any) => {
    try {
      const query = `
        query GetHubs($filter: HubFilterInput, $pagination: PaginationInput) {
          hubs(filter: $filter, pagination: $pagination) {
            pagination { cursor }
            results {
              id
              name
              region
            }
          }
        }
      `;

      const response = await axios.post(
        AEC_GRAPHQL_URL,
        { query, variables: { filter, pagination } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.errors) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      return response.data.data.hubs;
    } catch (error: any) {
      console.error('Error fetching AEC Hubs:', error.response?.data || error.message);
      throw error;
    }
  }
};