import api from "./api";

export interface LodCheckerApiRow {
  discipline: string;
  row: number;
  concept: string;
  req_lod: string;
  complet_geometry: "Y" | "N" | "NA" | null;
  lod_compliance: "Y" | "N" | "NA" | null;
  comments: string;
}

export interface LodComplianceMetric {
  yes: number;
  total: number;
  percentage: number;
}

export interface LodProjectComplianceResponse {
  totals: {
    geometry: LodComplianceMetric;
    lod: LodComplianceMetric;
    overall: number;
  };
  disciplines: Array<{
    discipline: string;
    rows: number;
    geometry: LodComplianceMetric;
    lod: LodComplianceMetric;
    overall: number;
  }>;
}

export const ModelCheckerService = {
  saveRow: async (
    projectId: string,
    accountId: string,
    modelId: string,
    payload: LodCheckerApiRow
  ): Promise<LodCheckerApiRow> => {
    const response = await api.post(`/model-checker/${accountId}/${projectId}/model-checker`, {
      ...payload,
      modelId,
    });
    return response.data?.data;
  },

  saveRowsBulk: async (
    projectId: string,
    accountId: string,
    modelId: string,
    payload: LodCheckerApiRow[]
  ): Promise<LodCheckerApiRow[]> => {
    const response = await api.post(`/model-checker/${accountId}/${projectId}/model-checker/bulk`, payload, {
      params: { modelId },
    });
    return response.data?.data || [];
  },

  getRowsByDiscipline: async (
    projectId: string,
    accountId: string,
    discipline: string,
    modelId: string
  ): Promise<LodCheckerApiRow[]> => {
    const response = await api.get(
      `/model-checker/${accountId}/${projectId}/model-checker/${encodeURIComponent(discipline)}`,
      { params: { modelId } }
    );
    return response.data?.data || [];
  },

  clearDisciplineRows: async (
    projectId: string,
    accountId: string,
    discipline: string,
    modelId: string
  ) => {
    const response = await api.delete(
      `/model-checker/${accountId}/${projectId}/model-checker/${encodeURIComponent(discipline)}`,
      { params: { modelId } }
    );
    return response.data;
  },

  getProjectCompliance: async (
    projectId: string,
    accountId: string,
    modelId: string
  ): Promise<LodProjectComplianceResponse | null> => {
    const response = await api.get(`/model-checker/${accountId}/${projectId}/model-checker-compliance`, {
      params: { modelId },
    });
    return response.data?.data || null;
  },
};
