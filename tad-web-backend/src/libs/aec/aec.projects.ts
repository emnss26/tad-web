import axios from "axios";

const AEC_GRAPHQL_URL = "https://developer.api.autodesk.com/aec/graphql";

export interface IAecProject {
  id: string;
  name: string;
  alternativeIdentifiers?: {
    dataManagementAPIProjectId?: string;
  };
}

interface IAecProjectsPage {
  pagination?: {
    cursor?: string | null;
  };
  results: IAecProject[];
}

export const AecProjectsLib = {
  async getProjects(
    token: string,
    hubId: string,
    cursor?: string
  ): Promise<IAecProjectsPage> {
    try {
      const baseFields = `
        pagination { cursor }
        results {
          id
          name
          alternativeIdentifiers { dataManagementAPIProjectId }
        }
      `;

      const queryFirst = `
        query GetProjects($hubId: ID!) {
          projects(hubId: $hubId) { ${baseFields} }
        }
      `;

      const queryNext = `
        query GetProjects($hubId: ID!, $cursor: String!) {
          projects(hubId: $hubId, pagination: { cursor: $cursor }) { ${baseFields} }
        }
      `;

      const query = cursor ? queryNext : queryFirst;
      const variables = cursor ? { hubId, cursor } : { hubId };

      const response = await axios.post(
        AEC_GRAPHQL_URL,
        { query, variables },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.errors) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      return response.data?.data?.projects || { results: [] };
    } catch (error: any) {
      console.error("Error fetching AEC Projects:", error.response?.data || error.message);
      throw error;
    }
  },

  async getAllProjects(token: string, hubId: string): Promise<IAecProject[]> {
    const out: IAecProject[] = [];
    const seenProjectIds = new Set<string>();
    const seenCursors = new Set<string>();
    let cursor: string | undefined;

    while (true) {
      const page = await AecProjectsLib.getProjects(token, hubId, cursor);
      const rows = Array.isArray(page?.results) ? page.results : [];
      rows.forEach((project) => {
        if (!project?.id || seenProjectIds.has(project.id)) return;
        seenProjectIds.add(project.id);
        out.push(project);
      });

      const nextCursor = page?.pagination?.cursor || undefined;
      if (!nextCursor || seenCursors.has(nextCursor)) break;
      seenCursors.add(nextCursor);
      cursor = nextCursor;
    }

    return out;
  },
};
