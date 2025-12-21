import axios from 'axios';

const AEC_GRAPHQL_URL = 'https://developer.api.autodesk.com/aec/graphql';

export interface IElementGroupResult {
  name: string;
  id: string;
  alternativeIdentifiers: {
    fileUrn: string;
    fileVersionUrn: string;
  };
}

export const AecModelsLib = {
  /**
   * Obtiene los grupos de elementos (modelos) asociados con un proyecto AEC.
   * @param token Token de acceso APS.
   * @param projectId ID del proyecto AEC.
   * @returns Promesa con la lista de modelos (element groups) y sus metadatos.
   */
  getModels: async (token: string, projectId: string): Promise<IElementGroupResult[]> => {
    try {
      const query = `
        query GetElementGroupsByProject($projectId: ID!) {
          elementGroupsByProject(projectId: $projectId) {
            pagination {
              cursor
            }
            results {
              name
              id
              alternativeIdentifiers {
                fileUrn
                fileVersionUrn
              }
            }
          }
        }
      `;

      const response = await axios.post(
        AEC_GRAPHQL_URL,
        { query, variables: { projectId } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.errors) {
        // Logueamos pero intentamos devolver array vacío o lanzar error según preferencia
        console.warn('AEC GraphQL Errors:', response.data.errors);
      }

      return response.data?.data?.elementGroupsByProject?.results || [];

    } catch (error: any) {
      console.error('Error fetching AEC models:', error.response?.data || error.message);
      throw new Error('Fallo al obtener modelos AEC');
    }
  }
};