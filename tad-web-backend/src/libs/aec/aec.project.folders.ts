import axios from 'axios';

const AEC_GRAPHQL_URL = 'https://developer.api.autodesk.com/aec/graphql';

export const AecProjectFoldersLib = {
  /**
   * Obtiene las carpetas de alto nivel de un proyecto
   * @param token Token de acceso
   * @param projectId ID del Proyecto
   * @param filter Filtros opcionales
   * @param pagination Paginación opcional
   */
  getFoldersByProject: async (token: string, projectId: string, filter?: any, pagination?: any) => {
    try {
      const query = `
        query GetFoldersByProject($projectId: ID!, $filter: FolderFilterInput, $pagination: PaginationInput) {
          foldersByProject(projectId: $projectId, filter: $filter, pagination: $pagination) {
            pagination { cursor }
            results {
              id
              name
              objectCount
              __typename 
            }
          }
        }
      `;

      const response = await axios.post(
        AEC_GRAPHQL_URL,
        { query, variables: { projectId, filter, pagination } },
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

      return response.data.data.foldersByProject;
    } catch (error: any) {
      console.error('Error fetching AEC Project Folders:', error.response?.data || error.message);
      throw error;
    }
  }
};