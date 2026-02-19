import { Request, Response } from "express";
import axios from "axios";
import { DataManagementLib } from "../../libs/dm/data.management";
import { getToken } from "../../utils/auth/auth.utils";

type CandidateFile = {
  id: string;
  name: string;
  urn: string;
};

function normalizeProjectId(projectId: string): string {
  return projectId.startsWith("b.") ? projectId : `b.${projectId}`;
}

function normalizeHubId(accountId: string): string {
  return accountId.startsWith("b.") ? accountId : `b.${accountId}`;
}

function hasWordMatch(fileName: string, words: string[]): boolean {
  const upper = fileName.toUpperCase();
  return words.some((word) => upper.includes(word));
}

async function collectFilesByExtensions(
  token: string,
  projectId: string,
  hubId: string,
  extensions: string[]
): Promise<CandidateFile[]> {
  const topFolders = await DataManagementLib.getTopFolders(token, hubId, projectId);
  const folders = topFolders?.data || [];

  const collected: CandidateFile[] = [];

  async function walkFolder(folderId: string): Promise<void> {
    const contents = await DataManagementLib.getFolderContents(token, projectId, folderId);
    const items = (contents?.data || []) as any[];

    const foldersInLevel = items.filter((entry) => entry.type === "folders");
    const filesInLevel = items.filter((entry) => entry.type === "items");

    filesInLevel.forEach((file) => {
      const name = String(file?.attributes?.displayName || "").trim();
      if (!name) return;

      const extension = name.split(".").pop()?.toLowerCase() || "";
      if (!extensions.includes(extension)) return;

      const tipVersionUrn = file?.relationships?.tip?.data?.id;
      if (!tipVersionUrn) return;

      collected.push({
        id: file.id,
        name,
        urn: tipVersionUrn,
      });
    });

    for (const folder of foldersInLevel) {
      await walkFolder(folder.id);
    }
  }

  for (const folder of folders) {
    await walkFolder(folder.id);
  }

  return collected;
}

async function getSignedDownloadUrl(token: string, projectId: string, versionUrn: string): Promise<string | null> {
  const version = await DataManagementLib.getVersionDetail(token, projectId, versionUrn);
  const storageHref = version?.data?.relationships?.storage?.meta?.link?.href;

  if (!storageHref) return null;

  const cleanStorageHref = String(storageHref).split("?")[0];
  const signed = await axios.get(`${cleanStorageHref}/signeds3download`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return signed?.data?.url || null;
}

export const GetFederatedModel = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    const { accountId, projectId } = req.params;
    const formattedProjectId = normalizeProjectId(projectId);
    const formattedHubId = normalizeHubId(accountId);

    const candidates = await collectFilesByExtensions(token, formattedProjectId, formattedHubId, ["rvt"]);
    const bestMatch = candidates.find((f) => hasWordMatch(f.name, ["FED", "FEDERADO", "FEDERATED"])) || candidates[0];

    if (!bestMatch) {
      return res.status(404).json({
        data: null,
        error: "File not found",
        message: "No federated RVT model was found in project folders.",
      });
    }

    return res.status(200).json({
      data: {
        federatedmodel: bestMatch.urn,
        displayName: bestMatch.name,
      },
      error: null,
      message: "Federated model found and version retrieved",
    });
  } catch (err: any) {
    console.error("[DM.GetFederatedModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Internal error",
      message: "Error accessing the federated model",
    });
  }
};

export const GetIFCFederatedModel = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    const { accountId, projectId } = req.params;
    const formattedProjectId = normalizeProjectId(projectId);
    const formattedHubId = normalizeHubId(accountId);

    const candidates = await collectFilesByExtensions(token, formattedProjectId, formattedHubId, ["ifc"]);
    const bestMatch = candidates.find((f) => hasWordMatch(f.name, ["FED-IFC", "FEDERADO-IFC", "FEDERATED-IFC"])) || candidates[0];

    if (!bestMatch) {
      return res.status(404).json({
        data: null,
        error: "File not found",
        message: "No federated IFC model was found in project folders.",
      });
    }

    return res.status(200).json({
      data: {
        ifcfederatedmodel: bestMatch.urn,
        displayName: bestMatch.name,
      },
      error: null,
      message: "Federated IFC model found and version retrieved",
    });
  } catch (err: any) {
    console.error("[DM.GetIFCFederatedModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Internal error",
      message: "Error accessing the federated IFC model",
    });
  }
};

export const GetGLBFederatedModel = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    const { accountId, projectId } = req.params;
    const formattedProjectId = normalizeProjectId(projectId);
    const formattedHubId = normalizeHubId(accountId);

    const candidates = await collectFilesByExtensions(token, formattedProjectId, formattedHubId, ["ifc"]);
    const bestMatch = candidates.find((f) => hasWordMatch(f.name, ["FED-IFC", "FEDERADO-IFC", "FEDERATED-IFC"])) || candidates[0];

    if (!bestMatch) {
      return res.status(404).json({
        data: null,
        error: "File not found",
        message: "No federated IFC model was found in project folders.",
      });
    }

    const signedUrl = await getSignedDownloadUrl(token, formattedProjectId, bestMatch.urn);

    if (!signedUrl) {
      return res.status(404).json({
        data: null,
        error: "Signed URL unavailable",
        message: "Unable to generate signed download URL for federated IFC model.",
      });
    }

    return res.status(200).json({
      data: {
        glbUrl: signedUrl,
        displayName: bestMatch.name,
        sourceType: "ifc",
      },
      error: null,
      message: "Federated IFC model URL generated. Local IFC->GLB conversion is not enabled in this backend.",
    });
  } catch (err: any) {
    console.error("[DM.GetGLBFederatedModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Internal error",
      message: "Error generating federated model URL",
    });
  }
};
