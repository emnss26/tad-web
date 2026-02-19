import { Request, Response } from "express";
import { ModelCheckerService } from "../../services/model.checker.service";
import { getToken } from "../../utils/auth/auth.utils";

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
    const saved = await ModelCheckerService.upsertEntry(accountId, projectId, req.body);

    if (!saved) {
      return res.status(400).json({
        data: null,
        error: "Invalid payload",
        message: "Discipline, row and concept are required.",
      });
    }

    return res.status(200).json({
      data: saved,
      error: null,
      message: "Model-checker entry saved",
    });
  } catch (err: any) {
    console.error("[ModelCheckerController.postDataModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Error saving data",
      message: "Error saving data",
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

    const { accountId, projectId, discipline } = req.params as {
      accountId: string;
      projectId: string;
      discipline?: string;
    };

    const data = discipline
      ? await ModelCheckerService.getByDiscipline(accountId, projectId, discipline)
      : await ModelCheckerService.getAll(accountId, projectId);

    return res.status(200).json({
      data,
      error: null,
      message: "Fetched entries",
    });
  } catch (err: any) {
    console.error("[ModelCheckerController.getDataModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Error fetching data",
      message: "Error fetching data",
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

    const { accountId, projectId, discipline } = req.params;

    const payload = {
      ...req.body,
      discipline,
    };

    const saved = await ModelCheckerService.upsertEntry(accountId, projectId, payload);

    if (!saved) {
      return res.status(400).json({
        data: null,
        error: "Invalid payload",
        message: "Discipline, row and concept are required.",
      });
    }

    return res.status(200).json({
      data: saved,
      error: null,
      message: "Entry updated",
    });
  } catch (err: any) {
    console.error("[ModelCheckerController.patchDataModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Error updating data",
      message: "Error updating data",
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

    const { accountId, projectId, discipline } = req.params;
    const deletedCount = await ModelCheckerService.deleteByDiscipline(accountId, projectId, discipline);

    return res.status(200).json({
      data: { deletedCount },
      error: null,
      message: "All entries deleted",
    });
  } catch (err: any) {
    console.error("[ModelCheckerController.deleteDataModel]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Error deleting data",
      message: "Error deleting data",
    });
  }
}
