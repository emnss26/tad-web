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

export const GetIssues = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ 
        data: null,
        error: "Unauthorized", 
        message: "Authorization token is required." 
      });
    }

    let { projectId } = req.params;
    if (projectId.startsWith("b.")) projectId = projectId.substring(2);

    const [rawIssues, issueTypesData, attrDefinitions] = await Promise.all([
      AccIssuesLib.getIssues(token, projectId),       
      AccIssuesLib.getIssueTypes(token, projectId),   
      AccIssuesLib.getAttributeDefinitions(token, projectId) 
    ]);

    if (!Array.isArray(rawIssues) || rawIssues.length === 0) {
      return res.status(200).json({ data: { count: 0, issues: [] }, message: "No Issues found" });
    }

    const issueTypeMap = issueTypesData.results.reduce((acc: any, type: any) => {
      acc[type.id] = type.title; 
      return acc;
    }, {});

    const attributeValueMap = buildCustomAttributeValueMap(attrDefinitions.results || []);
    const userFields = ["createdBy", "assignedTo", "closedBy", "openedBy", "updatedBy", "ownerId"];
    const userMap = await mapUserIdsToNames(token, projectId, rawIssues, userFields);
    const issuesWithAttributes = enrichCustomAttributes(rawIssues, attributeValueMap);

    const dbItems = issuesWithAttributes.map((issue: any) => ({
      // --- LLAVES DYNAMODB CORREGIDAS ---
      projectId: projectId,           // Partition Key
      service: `ISSUE#${issue.id}`,   // Sort Key
      
      entityType: 'issue',
      
      id: issue.id,
      displayId: issue.displayId, 
      title: issue.title,
      description: issue.description,
      status: issue.status, 
      issueTypeId: issue.issueTypeId,
      issueTypeName: issueTypeMap[issue.issueTypeId] || "Unknown Type",
      
      createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString(),
      dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString() : null,
      startDate: issue.startDate ? new Date(issue.startDate).toISOString() : null,
      closedAt: issue.closedAt ? new Date(issue.closedAt).toISOString() : null,
      openedAt: issue.openedAt ? new Date(issue.openedAt).toISOString() : null,

      createdBy: userMap[issue.createdBy] || "Unknown User",
      assignedTo: userMap[issue.assignedTo] || "Unassigned",
      closedBy: userMap[issue.closedBy] || null,
      openedBy: userMap[issue.openedBy] || null,
      updatedBy: userMap[issue.updatedBy] || null,
      ownerId: userMap[issue.ownerId] || null,
      
      rootCause: issue.rootCauseId || null,
      customAttributes: issue.customAttributes || []
    }));

    if (dbItems.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, dbItems)
        .catch(err => console.error("[DynamoDB Issues Error]:", err));
    }

    return res.status(200).json({
      data: { count: dbItems.length, issues: dbItems },
      error: null,
      message: "Issues fetched and synced successfully",
    });

  } catch (error: any) {
    console.error("[GetIssues Error]:", error);
    return res.status(500).json({ error: error.message });
  }
};