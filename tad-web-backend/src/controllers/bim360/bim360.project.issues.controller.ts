import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Bim360IssuesLib } from '../../libs/bim360/bim360.issues';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';
import { 
  mapUserIdsToNames, 
  buildCustomAttributeValueMap, 
  enrichCustomAttributes 
} from '../../utils/acc/services.helpers';

interface IssuesParams extends ParamsDictionary {
  projectId: string;
}

export const GetBim360Issues = async (req: Request<IssuesParams>, res: Response) => {
  try {
    // 1. Auth & Token
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ 
        data: null,
        error: "Unauthorized", 
        message: "Authorization token is required." 
      });
    }

    // 2. Params
    let { projectId } = req.params;
    if (projectId.startsWith('b.')) projectId = projectId.substring(2);

    // 3. Fetch Data in Parallel (Igual que ACC)
    // Usamos Promise.all para eficiencia
    const [rawIssues, issueTypesData, attrDefinitions] = await Promise.all([
      Bim360IssuesLib.getIssues(token, projectId, req.query),
      Bim360IssuesLib.getIssueTypes(token, projectId),
      Bim360IssuesLib.getAttributeDefinitions(token, projectId)
    ]);

    // 4. Early Exit
    if (!Array.isArray(rawIssues) || rawIssues.length === 0) {
      return res.status(200).json({ 
        data: { count: 0, issues: [] }, 
        error: null,
        message: "No BIM360 Issues found" 
      });
    }

    // 5. Data Processing & Mapping
    // Mapeo de Tipos de Incidencia (ID -> Nombre)
    // Nota: La estructura de respuesta de tipos en BIM360 a veces varía, aseguramos array
    const typesList = Array.isArray(issueTypesData) ? issueTypesData : (issueTypesData.results || []);
    const issueTypeMap = typesList.reduce((acc: any, type: any) => {
      acc[type.id] = type.title; 
      return acc;
    }, {});

    // Mapeo de Atributos Personalizados
    const attributesList = Array.isArray(attrDefinitions) ? attrDefinitions : (attrDefinitions.results || []);
    const attributeValueMap = buildCustomAttributeValueMap(attributesList);
    
    // Mapeo de Usuarios (IDs -> Nombres)
    const userFields = ["createdBy", "assignedTo", "closedBy", "openedBy", "updatedBy", "ownerId"];
    const userMap = await mapUserIdsToNames(token, projectId, rawIssues, userFields);
    
    // Enriquecer Incidencias con Atributos
    const issuesWithAttributes = enrichCustomAttributes(rawIssues, attributeValueMap);

    // 6. Map to Database Schema
    const dbItems = issuesWithAttributes.map((issue: any) => ({
      // --- KEYS DYNAMODB ---
      projectId: projectId,           // Partition Key
      service: `ISSUE#${issue.id}`,  // Sort Key
      
      entityType: 'issue',
      
      id: issue.id,
      displayId: issue.displayId || issue.identifier, // BIM360 a veces usa identifier
      title: issue.title,
      description: issue.description,
      status: issue.status, 
      issueTypeId: issue.issueTypeId,
      issueTypeName: issueTypeMap[issue.issueTypeId] || "Unknown Type",
      
      // Fechas normalizadas
      createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString(),
      dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString() : null,
      startDate: issue.startDate ? new Date(issue.startDate).toISOString() : null,
      closedAt: issue.closedAt ? new Date(issue.closedAt).toISOString() : null,
      openedAt: issue.openedAt ? new Date(issue.openedAt).toISOString() : null,

      // Usuarios Mapeados
      createdBy: userMap[issue.createdBy] || "Unknown User",
      assignedTo: userMap[issue.assignedTo] || "Unassigned",
      closedBy: userMap[issue.closedBy] || null,
      openedBy: userMap[issue.openedBy] || null,
      updatedBy: userMap[issue.updatedBy] || null,
      ownerId: userMap[issue.ownerId] || null,
      
      rootCause: issue.rootCauseId || null,
      customAttributes: issue.customAttributes || []
    }));

    // 7. Sync to DynamoDB
    if (dbItems.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, dbItems)
        .catch(err => console.error("[DynamoDB BIM360 Issues Error]:", err));
    }

    // 8. Return Response
    return res.status(200).json({
      data: { count: dbItems.length, issues: dbItems },
      error: null,
      message: "BIM360 Issues fetched and synced successfully",
    });

  } catch (error: any) {
    console.error("[GetBim360Issues Error]:", error);
    const statusCode = error.message?.includes("401") ? 401 : 500;
    
    return res.status(statusCode).json({
      data: null,
      error: error.message || "Internal Server Error",
      message: "Error retrieving BIM360 issues",
    });
  }
};