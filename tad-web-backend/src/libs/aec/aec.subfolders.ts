import axios from 'axios';

const AEC_GRAPHQL_URL = 'https://developer.api.autodesk.com/aec/graphql';

export interface IFolderResult {
  id: string;
  name: string;
  objectCount?: number;
}

export const AecSubfoldersLib = {
  /**
   * Obtiene subcarpetas dentro de una carpeta específica en un proyecto AEC.
   * @param token Token de acceso APS.
   * @param projectId Identificador del proyecto AEC.
   * @param folderId ID de la carpeta padre.
   * @returns Lista de objetos subcarpeta.
   */
  getSubFolders: async (token: string, projectId: string, folderId: string): Promise<IFolderResult[]> => {
    try {
      const query = `
        query GetFoldersByFolder($projectId: ID!, $folderId: ID!) {
          foldersByFolder(projectId: $projectId, folderId: $folderId) {
            results {
              id
              name
              objectCount
            }
          }
        }
      `;

      const response = await axios.post(
        AEC_GRAPHQL_URL,
        { query, variables: { projectId, folderId } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map((e: any) => e.message).join("\n");
        throw new Error(errorMessages);
      }

      return response.data?.data?.foldersByFolder?.results || [];
      
    } catch (error: any) {
      console.error('Error fetching subfolders:', error.response?.data || error.message);
      throw error;
    }
  }
};