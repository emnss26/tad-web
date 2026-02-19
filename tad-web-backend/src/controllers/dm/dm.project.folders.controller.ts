import { Request, Response } from "express";
import { DataManagementLib } from "../../libs/dm/data.management";
import { buildFolderContentTreeRecursively } from "../../utils/dm/dm.helpers";
import { getToken } from "../../utils/auth/auth.utils";

function normalizeHubId(accountId: string): string {
  return accountId.startsWith("b.") ? accountId : `b.${accountId}`;
}

function normalizeProjectId(projectId: string): string {
  return projectId.startsWith("b.") ? projectId : `b.${projectId}`;
}

export const GetFoldersStructure = async (req: Request, res: Response) => {
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
    const formattedHubId = normalizeHubId(accountId);
    const formattedProjectId = normalizeProjectId(projectId);

    const topFolders = await DataManagementLib.getTopFolders(token, formattedHubId, formattedProjectId);
    const folders = Array.isArray(topFolders?.data) ? topFolders.data : [];

    if (!folders.length) {
      return res.status(200).json({
        data: [],
        error: null,
        message: "No top folders found for this project.",
      });
    }

    const preferredRoot = folders.find((folder: any) => {
      const displayName = String(folder?.attributes?.displayName || folder?.attributes?.name || "").toLowerCase();
      return displayName === "project files" || displayName === "archivos de proyecto";
    });

    const roots = preferredRoot ? [preferredRoot] : folders;

    const tree = await Promise.all(
      roots.map((root: any) =>
        buildFolderContentTreeRecursively(
          token,
          formattedProjectId,
          root.id,
          root?.attributes?.displayName || root?.attributes?.name || "Root Folder"
        )
      )
    );

    return res.status(200).json({
      data: tree,
      error: null,
      message: "Project folder structure retrieved successfully.",
    });
  } catch (error: any) {
    const detail = error?.response?.data || error?.message || "Unknown error";
    console.error("[DM.GetFoldersStructure]", detail);
    return res.status(500).json({
      data: null,
      error: detail,
      message: "Failed to retrieve project folder structure.",
    });
  }
};

