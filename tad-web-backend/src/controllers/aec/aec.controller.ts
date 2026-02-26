import { Request, Response } from "express";
import { fetchModelParametersByCategory } from "../../libs/aec/aec.model.parameters";
import { AecParametersService } from "../../services/aec.parameters.service";
import { AecProjectService } from "../../services/aec.project.service";
import { AecWbsService } from "../../services/aec.wbs.service";
import { getToken } from "../../utils/auth/auth.utils";

const unauthorizedResponse = (res: Response) =>
  res.status(401).json({
    success: false,
    error: "Unauthorized",
    message: "Authorization token is required.",
    data: null,
  });

const resolveToken = (req: Request, res: Response): string | null => {
  const token = getToken(req);
  if (!token) {
    unauthorizedResponse(res);
    return null;
  }
  return token;
};

const toText = (value: unknown): string => String(value ?? "").trim();

const notFoundProjectResponse = (res: Response, dmProjectId: string) =>
  res.status(404).json({
    success: false,
    error: "ProjectNotFound",
    message: `No AEC project found for DM project id '${dmProjectId}'.`,
    data: null,
  });

export async function GetAECProjects(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  try {
    const projects = await AecProjectService.getAecProjects(token);
    const filtered = (projects || []).filter((project) =>
      toText(project?.alternativeIdentifiers?.dataManagementAPIProjectId)
    );

    return res.status(200).json({
      success: true,
      message: "AEC projects retrieved successfully",
      data: {
        aecProjects: filtered,
      },
      error: null,
    });
  } catch (error: any) {
    console.error("[AEC.GetAECProjects]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "GetAECProjectsFailed",
      message: "Failed to fetch AEC projects",
      data: null,
    });
  }
}

export async function GetAECModels(req: Request, res: Response) {
  const token = resolveToken(req, res);
  
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  if (!dmProjectId) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId is required",
      data: null,
    });
  }

  try {
    const payload = await AecProjectService.getModelsByDmProjectId(token, dmProjectId);
    if (!payload?.project) {
      return notFoundProjectResponse(res, dmProjectId);
    }

    return res.status(200).json({
      success: true,
      message: "AEC models retrieved successfully",
      data: {
        project: payload.project,
        models: payload.models,
      },
      error: null,
    });
  } catch (error: any) {
    console.error("[AEC.GetAECModels]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "GetAECModelsFailed",
      message: "Failed to fetch AEC models",
      data: null,
    });
  }
}

export async function GetAECModelParametersByCategory(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  const modelId = toText(req.query.modelId);
  const category = toText(req.query.category);

  if (!dmProjectId || !modelId || !category) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId, modelId and category are required",
      data: null,
    });
  }

  try {
    const resolved = await AecProjectService.resolveProjectByDmId(token, dmProjectId);
    if (!resolved) {
      return notFoundProjectResponse(res, dmProjectId);
    }

    const result = await fetchModelParametersByCategory(token, resolved.aecProjectId, modelId, category);
    return res.status(200).json({
      success: true,
      message: "Model parameters retrieved successfully",
      data: result,
      error: null,
    });
  } catch (error: any) {
    console.error("[AEC.GetAECModelParametersByCategory]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "GetAECModelParametersFailed",
      message: "Failed to fetch model parameters by category",
      data: null,
    });
  }
}

export async function SaveParameterCheck(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  const modelId = toText(req.body?.modelId);
  const disciplineId = toText(req.body?.disciplineId);
  const categoryId = toText(req.body?.categoryId) || "ALL";
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

  if (!dmProjectId || !modelId || !disciplineId) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId, modelId and disciplineId are required",
      data: null,
    });
  }

  try {
    const resolved = await AecProjectService.resolveProjectByDmId(token, dmProjectId);
    if (!resolved) {
      return notFoundProjectResponse(res, dmProjectId);
    }

    const result = await AecParametersService.saveCheck({
      dmProjectId,
      aecProjectId: resolved.aecProjectId,
      modelId,
      modelName: req.body?.modelName,
      disciplineId,
      categoryId,
      rows,
      summary: req.body?.summary,
    });

    return res.status(201).json({
      success: true,
      message: "Parameter check saved",
      data: result,
      error: null,
    });
  } catch (error: any) {
    console.error("[AEC.SaveParameterCheck]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "SaveParameterCheckFailed",
      message: "Failed to save parameter check",
      data: null,
    });
  }
}

export async function GetLastParameterCheck(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  const modelId = toText(req.query.modelId);
  const disciplineId = toText(req.query.disciplineId);

  if (!dmProjectId || !modelId || !disciplineId) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId, modelId and disciplineId are required",
      data: null,
    });
  }

  try {
    const result = await AecParametersService.getLastCheck({
      dmProjectId,
      modelId,
      disciplineId,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[AEC.GetLastParameterCheck]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "GetLastParameterCheckFailed",
      message: "Failed to fetch last parameter check",
      data: null,
    });
  }
}

export async function GetLastDisciplineByModel(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  const modelId = toText(req.query.modelId);
  if (!dmProjectId || !modelId) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId and modelId are required",
      data: null,
    });
  }

  try {
    const result = await AecParametersService.getLastDisciplineByModel(dmProjectId, modelId);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[AEC.GetLastDisciplineByModel]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "GetLastDisciplineByModelFailed",
      message: "Failed to fetch last discipline by model",
      data: null,
    });
  }
}

export async function GetProjectParameterCompliance(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  if (!dmProjectId) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId is required",
      data: null,
    });
  }

  try {
    const result = await AecParametersService.getProjectCompliance(dmProjectId);
    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error: any) {
    console.error("[AEC.GetProjectParameterCompliance]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "GetProjectParameterComplianceFailed",
      message: "Failed to fetch project parameter compliance",
      data: null,
    });
  }
}

export async function SaveProjectWbs(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  const modelId = toText(req.body?.modelId);
  const sourceName = toText(req.body?.sourceName);
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

  if (!dmProjectId || rows.length === 0) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId and rows are required",
      data: null,
    });
  }

  try {
    const result = await AecWbsService.saveProjectWbs({
      dmProjectId,
      modelId,
      sourceName,
      rows,
    });

    return res.status(201).json({
      success: true,
      message: "WBS saved",
      data: result,
      error: null,
    });
  } catch (error: any) {
    console.error("[AEC.SaveProjectWbs]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "SaveProjectWbsFailed",
      message: "Failed to save WBS",
      data: null,
    });
  }
}

export async function GetLatestProjectWbs(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  const modelId = toText(req.query.modelId);

  if (!dmProjectId) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId is required",
      data: null,
    });
  }

  try {
    const result = await AecWbsService.getLatestProjectWbs(dmProjectId, modelId || undefined);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[AEC.GetLatestProjectWbs]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "GetLatestProjectWbsFailed",
      message: "Failed to fetch latest WBS",
      data: null,
    });
  }
}

export async function RunWbsModelMatching(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  const modelId = toText(req.body?.modelId);
  const wbsSetId = toText(req.body?.wbsSetId);

  if (!dmProjectId || !modelId) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId and modelId are required",
      data: null,
    });
  }

  try {
    const result = await AecWbsService.runWbsModelMatching({
      token,
      dmProjectId,
      modelId,
      wbsSetId: wbsSetId || undefined,
    });

    return res.status(200).json({
      success: true,
      message: "WBS matching finished",
      data: result,
      error: null,
    });
  } catch (error: any) {
    console.error("[AEC.RunWbsModelMatching]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "RunWbsModelMatchingFailed",
      message: "Failed to run WBS matching",
      data: null,
    });
  }
}

export async function GetLatestWbsModelMatching(req: Request, res: Response) {
  const token = resolveToken(req, res);
  if (!token) return;

  const dmProjectId = toText(req.params.projectId);
  const modelId = toText(req.query.modelId);

  if (!dmProjectId || !modelId) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "projectId and modelId are required",
      data: null,
    });
  }

  try {
    const result = await AecWbsService.getLatestWbsModelMatching(dmProjectId, modelId);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[AEC.GetLatestWbsModelMatching]", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "GetLatestWbsModelMatchingFailed",
      message: "Failed to fetch latest WBS matching",
      data: null,
    });
  }
}
