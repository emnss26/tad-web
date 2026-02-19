import { Request, Response } from "express";
import { getToken } from "../../utils/auth/auth.utils";
import { ProjectPlansService } from "../../services/project.plans.service";

function normalizeBodyAsArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") return [body];
  return [];
}

export async function postDataModel(req: Request, res: Response) {
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
    const rows = normalizeBodyAsArray(req.body).slice(0, 1000);

    const saved = await ProjectPlansService.upsertPlans(accountId, projectId, rows);
    if (!saved.length) {
      return res.status(400).json({
        data: [],
        error: "No rows with a valid SheetNumber",
        message: "Add at least one item with a SheetNumber.",
      });
    }

    return res.status(200).json({
      data: saved,
      error: null,
      message: `Processed ${saved.length} plans successfully.`,
    });
  } catch (err: any) {
    console.error("[PlansController.postDataModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Error saving plans.",
      message: "Error saving plans.",
    });
  }
}

export async function getDataModel(req: Request, res: Response) {
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
    const { discipline } = req.query as { discipline?: string };
    const plans = await ProjectPlansService.getPlans(accountId, projectId, discipline);

    return res.status(200).json({
      data: plans,
      error: null,
      message: "Plans retrieved successfully.",
    });
  } catch (err: any) {
    console.error("[PlansController.getDataModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Error retrieving plans.",
      message: "Error retrieving plans.",
    });
  }
}

export async function patchDataModel(req: Request, res: Response) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    const { accountId, projectId, Id } = req.params;
    const { field, value } = req.body || {};

    if (!field || value === undefined) {
      return res.status(400).json({
        data: null,
        error: "Missing field/value",
        message: "Provide field and value to update.",
      });
    }

    const updated = await ProjectPlansService.patchPlanField(accountId, projectId, Id, field, value);

    if (!updated) {
      return res.status(404).json({
        data: null,
        error: "Not Found",
        message: `No plan with id ${Id} found.`,
      });
    }

    return res.status(200).json({
      data: null,
      error: null,
      message: `Field '${field}' updated successfully.`,
    });
  } catch (err: any) {
    console.error("[PlansController.patchDataModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Error updating plan.",
      message: "Error updating plan.",
    });
  }
}

export async function deleteDataModel(req: Request, res: Response) {
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
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.slice(0, 1000) : [];

    if (!ids.length) {
      return res.status(400).json({
        data: null,
        error: "Missing ids",
        message: "Send an 'ids' array with SheetNumber or Id values.",
      });
    }

    const deleted = await ProjectPlansService.deletePlans(accountId, projectId, ids);

    return res.status(200).json({
      data: { deleted },
      error: null,
      message: `Deleted ${deleted} plans.`,
    });
  } catch (err: any) {
    console.error("[PlansController.deleteDataModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Error deleting plans.",
      message: "Error deleting plans.",
    });
  }
}

