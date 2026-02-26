import api from "./api";

export interface AecProject {
  id: string;
  name: string;
  alternativeIdentifiers?: {
    dataManagementAPIProjectId?: string;
  };
}

export interface AecModel {
  id: string;
  name: string;
  urn: string;
  alternativeIdentifiers?: {
    fileUrn?: string;
    fileVersionUrn?: string;
  };
}

export interface AecElementRow {
  viewerDbId: number | null;
  dbId: number | string | null;
  elementId: string;
  externalElementId: string;
  revitElementId: string;
  category: string;
  familyName: string;
  elementName: string;
  typeMark: string;
  description: string;
  model: string;
  manufacturer: string;
  assemblyCode: string;
  assemblyDescription: string;
  count: number;
  compliance?: {
    pct?: number;
    filled?: number;
    total?: number;
  };
  rawProperties?: Array<Record<string, unknown>>;
  analysisCategoryId?: string;
  analysisCategoryName?: string;
  analysisCategoryQuery?: string;
}

export interface AecParameterSummary {
  totalElements: number;
  averageCompliancePct: number;
  fullyCompliant: number;
}

export interface AecModelParametersResponse {
  modelId: string;
  modelName: string | null;
  category: string;
  resolvedCategoryToken: string | null;
  filterQueryUsed: string | null;
  rows: AecElementRow[];
  summary: AecParameterSummary;
}

export interface SaveParameterCheckPayload {
  modelId: string;
  modelName?: string;
  disciplineId: string;
  categoryId?: string;
  rows: AecElementRow[];
  summary?: Partial<AecParameterSummary>;
}

export interface WbsRowPayload {
  code: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  plannedCost?: number | null;
  actualCost?: number | null;
  duration?: string;
}

export const AecService = {
  async getProjects(): Promise<AecProject[]> {
    const response = await api.get("/aec/graphql-projects");
    return response.data?.data?.aecProjects || [];
  },

  async getModels(dmProjectId: string): Promise<{ project: Record<string, unknown> | null; models: AecModel[] }> {
    const response = await api.get(`/aec/${encodeURIComponent(dmProjectId)}/graphql-models`);
    return {
      project: response.data?.data?.project || null,
      models: response.data?.data?.models || [],
    };
  },

  async getModelParametersByCategory(
    dmProjectId: string,
    modelId: string,
    category: string
  ): Promise<AecModelParametersResponse> {
    const response = await api.get(`/aec/${encodeURIComponent(dmProjectId)}/graphql-model-parameters`, {
      params: {
        modelId,
        category,
      },
    });
    return response.data?.data;
  },

  async saveParameterCheck(dmProjectId: string, payload: SaveParameterCheckPayload) {
    const response = await api.post(`/aec/${encodeURIComponent(dmProjectId)}/parameters/save-check`, payload);
    return response.data?.data;
  },

  async getLastParameterCheck(
    dmProjectId: string,
    params: { modelId: string; disciplineId: string; categoryId?: string }
  ) {
    const response = await api.get(`/aec/${encodeURIComponent(dmProjectId)}/parameters/last-check`, { params });
    return response.data;
  },

  async getLastDiscipline(dmProjectId: string, modelId: string) {
    const response = await api.get(`/aec/${encodeURIComponent(dmProjectId)}/parameters/last-discipline`, {
      params: { modelId },
    });
    return response.data;
  },

  async getProjectCompliance(dmProjectId: string) {
    const response = await api.get(`/aec/${encodeURIComponent(dmProjectId)}/parameters/project-compliance`);
    return response.data?.data;
  },

  async saveWbs(dmProjectId: string, payload: { modelId?: string; sourceName?: string; rows: WbsRowPayload[] }) {
    const response = await api.post(`/aec/${encodeURIComponent(dmProjectId)}/wbs/save`, payload);
    return response.data?.data;
  },

  async getLatestWbs(dmProjectId: string, modelId?: string) {
    const response = await api.get(`/aec/${encodeURIComponent(dmProjectId)}/wbs/latest`, {
      params: modelId ? { modelId } : undefined,
    });
    return response.data;
  },

  async runWbsMatch(dmProjectId: string, payload: { modelId: string; wbsSetId?: string }) {
    const response = await api.post(`/aec/${encodeURIComponent(dmProjectId)}/wbs/match/run`, payload);
    return response.data?.data;
  },

  async getLatestWbsMatch(dmProjectId: string, modelId: string) {
    const response = await api.get(`/aec/${encodeURIComponent(dmProjectId)}/wbs/match/latest`, {
      params: { modelId },
    });
    return response.data;
  },
};
