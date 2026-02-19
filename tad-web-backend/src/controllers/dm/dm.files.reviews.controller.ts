import { Request, Response } from "express";
import axios from "axios";
import { getToken } from "../../utils/auth/auth.utils";
import { config } from "../../config";
import { AccReviewsLib } from "../../libs/acc/acc.reviews";

function normalizeProjectId(projectId: string): string {
  return projectId.startsWith("b.") ? projectId : `b.${projectId}`;
}

function normalizeIds(rawIds: unknown): string[] {
  if (!Array.isArray(rawIds)) return [];

  return Array.from(
    new Set(
      rawIds
        .map((id) => String(id || "").trim())
        .filter((id) => id.length > 0 && id.length <= 1024)
    )
  );
}

export const GetFileRevisionStatus = async (req: Request, res: Response) => {
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

    let projectReviews: any[] = [];
    try {
      const fetchedReviews = await AccReviewsLib.getReviews(token, formattedProjectId);
      projectReviews = Array.isArray(fetchedReviews) ? fetchedReviews : [];
    } catch (reviewErr: any) {
      const reviewDetail = reviewErr?.response?.data || reviewErr?.message || "Unable to fetch project reviews";
      console.warn("[DM.GetFileRevisionStatus] Reviews lookup warning:", reviewDetail);
      projectReviews = [];
    }

    const reviewMap = new Map(projectReviews.map((review: any) => [review.id, review]));

    const merged = await Promise.all(
      itemIds.map(async (itemId) => {
        const url =
          `${config.aps.baseUrl}/construction/reviews/v1/projects/${formattedProjectId}` +
          `/versions/${encodeURIComponent(itemId)}/approval-status`;

        const { data: approvalStatus } = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const result = Array.isArray(approvalStatus?.results)
          ? approvalStatus.results[0] || {}
          : {};

        const reviewId = result?.review?.id || null;
        const review = reviewId ? reviewMap.get(reviewId) : null;

        return {
          itemId,
          reviewId,
          status: result?.approvalStatus?.value || "UNKNOWN",
          label: result?.approvalStatus?.label || "",
          reviewStatus: result?.review?.status || null,
          reviewSequenceId: result?.review?.sequenceId || null,
          reviewName: review?.name || null,
          createdAt: review?.createdAt || null,
          createdByName: review?.createdBy?.name || review?.createdBy?.autodeskId || null,
          currentStepDueDate: review?.currentStepDueDate || null,
          updatedAt: review?.updatedAt || null,
          finishedAt: review?.finishedAt || null,
          sequenceId: review?.sequenceId || null,
          workflowId: review?.workflowId || null,
        };
      })
    );

    return res.status(200).json({
      data: merged,
      error: null,
      message: "File revision statuses fetched successfully.",
    });
  } catch (error: any) {
    const detail = error?.response?.data || error?.message || "Unknown error";
    console.error("[DM.GetFileRevisionStatus]", detail);
    return res.status(500).json({
      data: null,
      error: detail,
      message: "Error fetching file revision statuses.",
    });
  }
};

