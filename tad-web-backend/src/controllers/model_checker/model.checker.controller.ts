import { Request, Response } from "express";
import { ModelCheckerService } from "../../services/model.checker.service";
import { getToken } from "../../utils/auth/auth.utils";

function resolveModelId(req: Request): string {
  const fromParams = String(req.params?.modelId || "").trim();
  if (fromParams) return fromParams;

  const fromQuery = String((req.query as any)?.modelId || "").trim();
  if (fromQuery) return fromQuery;

  const fromBody = String((req.body as any)?.modelId || "").trim();
  if (fromBody) return fromBody;

  return "";
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
    const modelId = resolveModelId(req);
    if (!modelId) {
      return res.status(400).json({
        data: null,
        error: "Missing modelId",
        message: "modelId is required for model-checker writes.",
      });
    }

    const saved = await ModelCheckerService.upsertEntry(accountId, projectId, modelId, req.body);

    if (!saved) {
      return res.status(400).json({
        data: null,
        error: "Invalid payload",
        message: "modelId, discipline, row and concept are required.",
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

export async function postDataModelBulk(req: Request, res: Response) {
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
    const modelId = resolveModelId(req);
    if (!modelId) {
      return res.status(400).json({
        data: null,
        error: "Missing modelId",
        message: "modelId is required for model-checker writes.",
      });
    }

    if (!Array.isArray(req.body)) {
      return res.status(400).json({
        data: null,
        error: "Invalid payload",
        message: "Bulk payload must be an array of rows.",
      });
    }

    const saved = await ModelCheckerService.replaceDisciplineEntries(accountId, projectId, modelId, req.body);
    if (!saved) {
      return res.status(400).json({
        data: null,
        error: "Invalid payload",
        message: "discipline, row and concept are required for every row.",
      });
    }

    return res.status(200).json({
      data: saved,
      error: null,
      message: "Model-checker discipline saved",
    });
  } catch (err: any) {
    console.error("[ModelCheckerController.postDataModelBulk]", err);
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
    const modelId = resolveModelId(req);
    if (!modelId) {
      return res.status(400).json({
        data: null,
        error: "Missing modelId",
        message: "modelId is required for model-checker reads.",
      });
    }

    const data = discipline
      ? await ModelCheckerService.getByDiscipline(accountId, projectId, modelId, discipline)
      : await ModelCheckerService.getAll(accountId, projectId, modelId);

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
    const modelId = resolveModelId(req);
    if (!modelId) {
      return res.status(400).json({
        data: null,
        error: "Missing modelId",
        message: "modelId is required for model-checker updates.",
      });
    }

    const payload = {
      ...req.body,
      discipline,
    };

    const saved = await ModelCheckerService.upsertEntry(accountId, projectId, modelId, payload);

    if (!saved) {
      return res.status(400).json({
        data: null,
        error: "Invalid payload",
        message: "modelId, discipline, row and concept are required.",
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
    const modelId = resolveModelId(req);
    if (!modelId) {
      return res.status(400).json({
        data: null,
        error: "Missing modelId",
        message: "modelId is required for model-checker deletes.",
      });
    }

    const deletedCount = await ModelCheckerService.deleteByDiscipline(accountId, projectId, modelId, discipline);

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

export async function getProjectComplianceData(req: Request, res: Response) {
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
    const modelId = resolveModelId(req);
    if (!modelId) {
      return res.status(400).json({
        data: null,
        error: "Missing modelId",
        message: "modelId is required for model-checker compliance.",
      });
    }

    const data = await ModelCheckerService.getProjectCompliance(accountId, projectId, modelId);

    return res.status(200).json({
      data,
      error: null,
      message: "Model-checker project compliance",
    });
  } catch (err: any) {
    console.error("[ModelCheckerController.getProjectComplianceData]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Error fetching compliance",
      message: "Error fetching compliance",
    });
  }
}
