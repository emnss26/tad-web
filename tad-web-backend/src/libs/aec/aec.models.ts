import axios from "axios";

const AEC_GRAPHQL_URL = "https://developer.api.autodesk.com/aec/graphql";

export interface IElementGroupResult {
  name: string;
  id: string;
  alternativeIdentifiers: {
    fileUrn: string;
    fileVersionUrn: string;
  };
}

export const AecModelsLib = {
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
            "Content-Type": "application/json",
          },
        }
      );

      if (Array.isArray(response.data?.errors) && response.data.errors.length > 0) {
        const message = response.data.errors[0]?.message || "AEC GraphQL error";
        throw new Error(message);
      }

      return response.data?.data?.elementGroupsByProject?.results || [];
    } catch (error: any) {
      console.error("Error fetching AEC models:", error.response?.data || error.message);
      throw new Error("Failed to fetch AEC models");
    }
  },
};
