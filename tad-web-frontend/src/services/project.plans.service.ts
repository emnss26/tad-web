import api from "./api";

export interface ProjectPlanRow {
  id: string;
  SheetName: string;
  SheetNumber: string;
  Discipline: string;
  Revision: string;
  lastModifiedTime?: string;
  exists?: boolean;
  revisionProcess?: string;
  revisionStatus?: string;
}

export const ProjectPlansService = {
  getPlans: async (projectId: string, accountId: string, discipline?: string) => {
    const response = await api.get(`/plans/${accountId}/${projectId}/plans`, {
      params: discipline ? { discipline } : undefined,
    });
    return response.data?.data || [];
  },

  savePlans: async (projectId: string, accountId: string, plans: ProjectPlanRow[]) => {
    const payload = plans.map((plan) => ({
      Id: plan.id,
      SheetName: plan.SheetName || "",
      SheetNumber: plan.SheetNumber || "",
      Discipline: plan.Discipline || "",
      Revision: String(plan.Revision || ""),
      LastModifiedDate: plan.lastModifiedTime || "",
      InFolder: Boolean(plan.exists),
      InARevisionProcess: plan.revisionProcess || "",
      RevisionStatus: plan.revisionStatus || "",
    }));

    const response = await api.post(`/plans/${accountId}/${projectId}/plans`, payload);
    return response.data?.data || [];
  },

  deletePlans: async (projectId: string, accountId: string, ids: string[]) => {
    const response = await api.delete(`/plans/${accountId}/${projectId}/plans`, {
      data: { ids },
    });
    return response.data?.data || null;
  },
};

