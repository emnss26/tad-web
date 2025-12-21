import axios from 'axios';

const AEC_GRAPHQL_URL = 'https://developer.api.autodesk.com/aec/graphql';

export const AecProjectsLib = {
  /**
   * Obtiene los proyectos dentro de un Hub específico
   * @param token Token de acceso
   * @param hubId ID del Hub
   * @param filter Filtros opcionales
   * @param pagination Paginación opcional
   */
  getProjects: async (token: string, hubId: string, filter?: any, pagination?: any) => {
    try {
      const query = `
        query GetProjects($hubId: ID!, $filter: ProjectFilterInput, $pagination: PaginationInput) {
          projects(hubId: $hubId, filter: $filter, pagination: $pagination) {
            pagination { cursor }
            results {
              id
              name
              hubId
            }
          }
        }
      `;

      const response = await axios.post(
        AEC_GRAPHQL_URL,
        { query, variables: { hubId, filter, pagination } },
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

      return response.data.data.projects;
    } catch (error: any) {
      console.error('Error fetching AEC Projects:', error.response?.data || error.message);
      throw error;
    }
  }
};