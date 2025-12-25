import { Request, Response } from 'express';
import { AccIssuesLib } from '../../libs/acc/acc.issues';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';
import { 
  mapUserIdsToNames, 
  buildCustomAttributeValueMap, 
  enrichCustomAttributes 
} from '../../utils/acc/services.helpers';

/**
 * GetIssues
 * Obtiene issues, enriquece nombres y atributos, y guarda en DynamoDB.
 * Ruta: GET /api/acc/accounts/:accountId/projects/:projectId/issues
 */
export const GetIssues = async (req: Request, res: Response) => {
  try {
    // 1. Auth & Params
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized", message: "Token missing" });

    let { projectId } = req.params;
    const { accountId } = req.params;

    // Limpieza de ID (b. prefix)
    if (projectId.startsWith("b.")) {
      projectId = projectId.substring(2);
    }

    if (!projectId || !accountId) return res.status(400).json({ error: "Bad Request", message: "Missing params" });

    // 2. Fetch Data de Autodesk (Paralelismo)
    const [rawIssues, issueTypesData, attrDefinitions] = await Promise.all([
      AccIssuesLib.getIssues(token, projectId),       
      AccIssuesLib.getIssueTypes(token, projectId),   
      AccIssuesLib.getAttributeDefinitions(token, projectId) 
    ]);

    if (!Array.isArray(rawIssues) || rawIssues.length === 0) {
      return res.status(200).json({ 
        data: { count: 0, issues: [] }, 
        message: "No Issues found" 
      });
    }

    // 3. Crear Mapas de Referencia
    const issueTypeMap = issueTypesData.results.reduce((acc: any, type: any) => {
      acc[type.id] = type.title; 
      return acc;
    }, {});

    const attributeValueMap = buildCustomAttributeValueMap(attrDefinitions.results || []);
    
    // Mapa de Usuarios
    const userFields = ["createdBy", "assignedTo", "closedBy", "openedBy", "updatedBy", "ownerId"];
    const userMap = await mapUserIdsToNames(token, projectId, rawIssues, userFields);

    // 4. Enriquecimiento de Atributos (Usando el Helper) ✅
    // Esto nos devuelve los issues con los customAttributes ya legibles
    const issuesWithAttributes = enrichCustomAttributes(rawIssues, attributeValueMap);

    // 5. Preparar Objetos para DynamoDB (Mapeo Final)
    const dbItems = issuesWithAttributes.map((issue: any) => ({
      // --- LLAVES DYNAMODB ---
      pk: `PROJECT#${projectId}`,
      sk: `ISSUE#${issue.id}`,
      
      // --- DATOS PLANOS ---
      entityType: 'issue',
      accountId: accountId,
      projectId: projectId,
      
      id: issue.id,
      displayId: issue.displayId, 
      title: issue.title,
      description: issue.description,
      status: issue.status, 
      issueTypeId: issue.issueTypeId,
      issueTypeName: issueTypeMap[issue.issueTypeId] || "Unknown Type",
      
      // Fechas
      createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString(),
      dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString() : null,
      startDate: issue.startDate ? new Date(issue.startDate).toISOString() : null,
      closedAt: issue.closedAt ? new Date(issue.closedAt).toISOString() : null,
      openedAt: issue.openedAt ? new Date(issue.openedAt).toISOString() : null,

      // Usuarios (Ya con nombres reales del mapa)
      createdBy: userMap[issue.createdBy] || "Unknown User",
      assignedTo: userMap[issue.assignedTo] || "Unassigned",
      closedBy: userMap[issue.closedBy] || null,
      openedBy: userMap[issue.openedBy] || null,
      updatedBy: userMap[issue.updatedBy] || null,
      ownerId: userMap[issue.ownerId] || null,
      
      // Root Cause
      rootCause: issue.rootCauseId || null,

      // Custom Attributes completos (Ya enriquecidos en el paso 4)
      customAttributes: issue.customAttributes || []
    }));

    // 6. Guardar en DynamoDB
    if (dbItems.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, dbItems)
        .then(() => console.log(`[DynamoDB] Synced ${dbItems.length} issues for project ${projectId}`))
        .catch(err => console.error(`[DynamoDB] Error syncing issues:`, err));
    }

    // 7. Responder
    return res.status(200).json({
      data: {
        count: dbItems.length,
        issues: dbItems, 
      },
      error: null,
      message: "Issues fetched and synced successfully",
    });

  } catch (error: any) {
    console.error("[GetIssues Error]:", error);
    const statusCode = error.message?.includes("401") ? 401 : 500;
    return res.status(statusCode).json({
      data: null,
      error: error.message || "Internal Server Error",
      message: "Error fetching issues",
    });
  }
};