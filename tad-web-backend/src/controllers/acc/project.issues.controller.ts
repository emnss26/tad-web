import { Request, Response } from 'express';
import { AccIssuesLib } from '../../libs/acc/acc.issues';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';
import { 
  mapUserIdsToNames, 
  buildCustomAttributeValueMap, 
  enrichCustomAttributes 
} from '../../utils/acc/issues.helpers';

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

    // 2. Fetch Data de Autodesk (Paralelismo donde sea posible)
    // Obtenemos Issues y Tipos primero
    const [rawIssues, issueTypesData, attrDefinitions] = await Promise.all([
      AccIssuesLib.getIssues(token, projectId),       // Trae paginación completa
      AccIssuesLib.getIssueTypes(token, projectId),   // Trae tipos (Design, Safety...)
      AccIssuesLib.getAttributeDefinitions(token, projectId) // Trae definiciones custom
    ]);

    if (!Array.isArray(rawIssues) || rawIssues.length === 0) {
      return res.status(200).json({ 
        data: { issues: [] }, 
        message: "No Issues found" 
      });
    }

    // 3. Crear Mapas de Referencia
    
    // A. Mapa de Tipos de Issue (ID -> Título)
    const issueTypeMap = issueTypesData.results.reduce((acc: any, type: any) => {
      acc[type.id] = type.title; // Ej: "Safety"
      // Si hay subtipos, también podríamos mapearlos aquí si fuera necesario
      return acc;
    }, {});

    // B. Mapa de Usuarios (ID -> Nombre Real)
    // Esta función llama a la API de usuarios para resolver los IDs encontrados en los issues
    const userMap = await mapUserIdsToNames(token, projectId, rawIssues);

    // 4. Enriquecimiento Nivel 1: Nombres y Tipos
    const issuesWithNames = rawIssues.map((issue: any) => ({
      ...issue,
      issueTypeName: issueTypeMap[issue.issueTypeId] || "Unknown Type",
      createdBy: userMap[issue.createdBy] || "Unknown User",
      assignedTo: userMap[issue.assignedTo] || "Unknown User",
      closedBy: userMap[issue.closedBy] || "Unknown User",
      openedBy: userMap[issue.openedBy] || "Unknown User",
      updatedBy: userMap[issue.updatedBy] || "Unknown User",
      ownerId: userMap[issue.ownerId] || "Unknown User",
    }));

    // 5. Enriquecimiento Nivel 2: Atributos Personalizados (Custom Attributes)
    // Construimos el mapa de valores legibles (Ej: optionId "123" -> "High Priority")
    const attributeValueMap = buildCustomAttributeValueMap(attrDefinitions.results || []);
    
    // Reemplazamos los IDs por valores legibles en el array customAttributes
    const fullyEnrichedIssues = enrichCustomAttributes(issuesWithNames, attributeValueMap);

    // 6. Preparar Objetos para DynamoDB
    const dbItems = fullyEnrichedIssues.map((issue: any) => ({
      // --- LLAVES DYNAMODB ---
      pk: `PROJECT#${projectId}`,
      sk: `ISSUE#${issue.id}`,
      
      // --- DATOS PLANOS (Flattened) ---
      entityType: 'issue',
      accountId: accountId,
      projectId: projectId,
      
      id: issue.id,
      displayId: issue.displayId, // El número humano (Ej: #45)
      title: issue.title,
      description: issue.description,
      status: issue.status, // open, closed, answered
      issueTypeId: issue.issueTypeId,
      issueTypeName: issue.issueTypeName,
      
      // Fechas
      createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : null,
      dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString() : null,
      updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString(),
      closedAt: issue.closedAt ? new Date(issue.closedAt).toISOString() : null,

      // Usuarios (Ya con nombres reales)
      createdBy: issue.createdBy,
      assignedTo: issue.assignedTo,
      closedBy: issue.closedBy,
      
      // Root Cause (si existe)
      rootCause: issue.rootCauseId || null,

      // Custom Attributes completos (Array de objetos)
      customAttributes: issue.customAttributes || []
    }));

    // 7. Guardar en DynamoDB (Batch Write)
    // Esto asegura que la DB siempre esté sincronizada con la última consulta
    if (dbItems.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, dbItems)
        .then(() => console.log(`[DynamoDB] Synced ${dbItems.length} issues for project ${projectId}`))
        .catch(err => console.error(`[DynamoDB] Error syncing issues:`, err));
    }

    // 8. Responder
    return res.status(200).json({
      data: {
        count: fullyEnrichedIssues.length,
        issues: fullyEnrichedIssues, // Enviamos el JSON enriquecido
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