import { Request, Response } from "express";
import { ModelDataService } from "../../services/modeldata.service";

export async function postModelData(req: Request, res: Response) {
  const { accountId, projectId, modelId } = req.params;
  const rows = Array.isArray(req.body) ? req.body : [];

  try {
    const result = await ModelDataService.upsertRows({ accountId, projectId, modelId, rows });
    return res.status(200).json({ data: result, error: null, message: "Batch processed" });
  } catch (err: any) {
    console.error("postModelData error:", err);
    return res.status(500).json({ data: null, error: err.message, message: "Internal error" });
  }
}

export async function getModelData(req: Request, res: Response) {
  const { accountId, projectId, modelId } = req.params;
  const { discipline } = req.query as { discipline?: string };

  try {
    const items = await ModelDataService.getRows({ accountId, projectId, modelId, discipline });

    const normalized = (items || []).map((it: any) => ({
    ...it,
    dbId: it?.dbId != null ? String(it.dbId) : it.dbId,
    }));

    return res.status(200).json({ data: normalized, error: null, message: "Data retrieved" });
  } catch (err: any) {
    console.error("getModelData error:", err);
    return res.status(500).json({ data: null, error: err.message, message: "Internal error" });
  }
}

export async function patchModelData(req: Request, res: Response) {
  const { accountId, projectId, modelId, dbId } = req.params;
  const { field, value } = req.body;

  try {
    await ModelDataService.patchField({ accountId, projectId, modelId, dbId, field, value });
    return res.status(200).json({ data: null, error: null, message: "Updated" });
  } catch (err: any) {
    console.error("patchModelData error:", err);
    return res.status(500).json({ data: null, error: err.message, message: "Internal error" });
  }
}