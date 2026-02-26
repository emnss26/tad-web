import { Request, Response } from 'express';
import { DataManagementLib } from '../../libs/dm/data.management';
import { searchFilesRecursively } from '../../utils/dm/dm.helpers';
import { getToken } from '../../utils/auth/auth.utils';

export const GetProjectModelFiles = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required."
      });
    }

    const { projectId } = req.params;
    const { hubId } = req.query;

    if (!hubId) {
      return res.status(400).json({
        data: null,
        error: "Bad Request",
        message: "Missing hubId query parameter"
      });
    }

    const formattedProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;
    const targetExtensions = ['rvt',  'nwd'];

    const topFoldersData = await DataManagementLib.getTopFolders(token, hubId as string, formattedProjectId);
    const topFolders = Array.isArray(topFoldersData?.data) ? topFoldersData.data : [];

    const filteredTopFolders = topFolders.filter((folder: any) => {
      const folderName = String(folder?.attributes?.name || folder?.attributes?.displayName || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ");

      if (!folderName) return true;
      return (
        !folderName.includes("shared") &&
        !folderName.includes("compart") &&
        !folderName.includes("consumed") &&
        !folderName.includes("consumid")
      );
    });

    const allFilesNested = await Promise.all(
      filteredTopFolders.map(async (topFolder: any) =>
        searchFilesRecursively(
          token,
          formattedProjectId,
          topFolder.id,
          topFolder?.attributes?.name || topFolder?.attributes?.displayName || "Root Folder",
          targetExtensions
        )
      )
    );

    const flatFilesList = allFilesNested.flat();
    const dedupedMap = new Map<string, any>();

    flatFilesList.forEach((file: any) => {
      const dedupeKey = String(file?.id || file?.urn || "");
      if (!dedupeKey) return;

      const existing = dedupedMap.get(dedupeKey);
      if (!existing) {
        dedupedMap.set(dedupeKey, file);
        return;
      }

      const currentVersion = Number(file?.versionNumber || 0);
      const existingVersion = Number(existing?.versionNumber || 0);
      if (currentVersion > existingVersion) {
        dedupedMap.set(dedupeKey, file);
      }
    });

    const uniqueFiles = Array.from(dedupedMap.values());

    return res.status(200).json({
      data: uniqueFiles,
      count: uniqueFiles.length,
      message: "Model files retrieved successfully"
    });
  } catch (error: any) {
    const errorDetail = error.response?.data || error.message;
    console.error("Error fetching model files:", errorDetail);

    return res.status(500).json({
      data: null,
      error: errorDetail,
      message: "Failed to retrieve model files"
    });
  }
};
