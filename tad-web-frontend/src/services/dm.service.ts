import api from './api'; // Tu instancia de axios configurada

export interface DmFolderNode {
  id: string;
  name: string;
  type: "folder" | "file" | string;
  children?: DmFolderNode[];
  version_urn?: string | null;
  version?: number | null;
  versiontype?: string | null;
  versionschema?: string | null;
}

interface DmModelFile {
  id: string;
  name: string;
  folderName: string;
  extension: string;
  urn: string;
  versionNumber?: number;
}

function normalizeFolderName(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[_-]+/g, " ").trim();
}

function isSharedFolderName(folderName: unknown): boolean {
  const normalized = normalizeFolderName(folderName);
  if (!normalized) return false;
  return (
    normalized.includes("shared") ||
    normalized.includes("compart") ||
    normalized.includes("consumed") ||
    normalized.includes("consumid")
  );
}

function dedupeAndFilterModels(models: DmModelFile[]): DmModelFile[] {
  const byKey = new Map<string, DmModelFile>();

  models.forEach((file) => {
    if (isSharedFolderName(file?.folderName)) return;

    const urn = String(file?.urn || "").trim();
    const id = String(file?.id || "").trim();
    const dedupeKey = urn || id;
    if (!dedupeKey) return;

    const existing = byKey.get(dedupeKey);
    if (!existing) {
      byKey.set(dedupeKey, file);
      return;
    }

    const currentVersion = Number(file?.versionNumber || 0);
    const existingVersion = Number(existing?.versionNumber || 0);
    if (currentVersion > existingVersion) {
      byKey.set(dedupeKey, file);
    }
  });

  return Array.from(byKey.values());
}

export const DmService = {
  /**
   * Obtiene todos los archivos de modelo (rvt, dwg, nwd) del proyecto recursivamente.
   * Requiere hubId (b.accountId).
   */
  getProjectModels: async (projectId: string, hubId: string) => {
    const formattedHubId = hubId.startsWith('b.') ? hubId : `b.${hubId}`;
    
    const response = await api.get(`/dm/projects/${projectId}/model-files`, {
      params: { hubId: formattedHubId }
    });

    const models = Array.isArray(response?.data?.data) ? (response.data.data as DmModelFile[]) : [];
    const cleaned = dedupeAndFilterModels(models);

    return {
      ...response.data,
      data: cleaned,
      count: cleaned.length,
    };
  },

  getFederatedModel: async (projectId: string, accountId: string) => {
    const response = await api.get(`/dm/items/${accountId}/${projectId}/federatedmodel`);
    return response.data?.data || null;
  },

  getFederatedIfcModel: async (projectId: string, accountId: string) => {
    const response = await api.get(`/dm/items/${accountId}/${projectId}/federated-ifc`);
    return response.data?.data || null;
  },

  getFederatedGlbUrl: async (projectId: string, accountId: string) => {
    const response = await api.get(`/dm/items/${accountId}/${projectId}/federated-glb`);
    return response.data?.data || null;
  },

  getFolderStructure: async (projectId: string, accountId: string): Promise<DmFolderNode[]> => {
    const response = await api.get(`/dm/folders/${accountId}/${projectId}/folder-structure`);
    return response.data?.data || [];
  },

  getFileData: async (projectId: string, accountId: string, itemIds: string[]) => {
    const response = await api.post(`/dm/items/${accountId}/${projectId}/file-data`, { itemIds });
    return response.data?.data || [];
  },

  getFileRevisions: async (projectId: string, accountId: string, itemIds: string[]) => {
    const response = await api.post(`/dm/items/${accountId}/${projectId}/file-revisions`, { itemIds });
    return response.data?.data || [];
  },
};
