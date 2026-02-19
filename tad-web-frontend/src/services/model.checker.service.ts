import api from "./api";

export interface LodCheckerApiRow {
  discipline: string;
  row: number;
  concept: string;
  req_lod: string;
  complet_geometry: "Y" | "N" | "NA";
  lod_compliance: "Y" | "N" | "NA";
  comments: string;
}

export const ModelCheckerService = {
  saveRow: async (
    projectId: string,
    accountId: string,
    payload: LodCheckerApiRow
  ): Promise<LodCheckerApiRow> => {
    const response = await api.post(`/model-checker/${accountId}/${projectId}/model-checker`, payload);
    return response.data?.data;
  },

  getRowsByDiscipline: async (
    projectId: string,
    accountId: string,
    discipline: string
  ): Promise<LodCheckerApiRow[]> => {
    const response = await api.get(`/model-checker/${accountId}/${projectId}/model-checker/${encodeURIComponent(discipline)}`);
    return response.data?.data || [];
  },

  clearDisciplineRows: async (
    projectId: string,
    accountId: string,
    discipline: string
  ) => {
    const response = await api.delete(`/model-checker/${accountId}/${projectId}/model-checker/${encodeURIComponent(discipline)}`);
    return response.data;
  },
};
