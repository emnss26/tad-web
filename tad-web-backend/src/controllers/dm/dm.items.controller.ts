import { Request, Response } from "express";
import { DataManagementLib } from "../../libs/dm/data.management";
import { getToken } from "../../utils/auth/auth.utils";

function normalizeProjectId(projectId: string): string {
  return projectId.startsWith("b.") ? projectId : `b.${projectId}`;
}

function normalizeIds(rawIds: unknown): string[] {
  if (!Array.isArray(rawIds)) return [];

  return Array.from(
    new Set(
      rawIds
        .map((id) => String(id || "").trim())
        .filter((id) => id.length > 0 && id.length <= 512)
    )
  );
}

export const GetFileData = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    const { projectId } = req.params;
    const itemIds = normalizeIds(req.body?.itemIds);

    if (!itemIds.length) {
      return res.status(400).json({
        data: null,
        error: "Invalid input",
        message: "itemIds must be a non-empty array.",
      });
    }

    if (itemIds.length > 200) {
      return res.status(400).json({
        data: null,
        error: "Too many items",
        message: "Maximum 200 itemIds per request.",
      });
    }

    const formattedProjectId = normalizeProjectId(projectId);

    const details = await Promise.all(
      itemIds.map(async (itemId) => {
        const payload = await DataManagementLib.getItemDetail(token, formattedProjectId, itemId);
        return {
          itemId,
          data: payload?.data || null,
          included: payload?.included || [],
        };
      })
    );

    return res.status(200).json({
      data: details,
      error: null,
      message: "File metadata fetched successfully.",
    });
  } catch (error: any) {
    const detail = error?.response?.data || error?.message || "Unknown error";
    console.error("[DM.GetFileData]", detail);
    return res.status(500).json({
      data: null,
      error: detail,
      message: "Error fetching file metadata.",
    });
  }
};

