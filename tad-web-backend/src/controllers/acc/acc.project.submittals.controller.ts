import { Request, Response } from 'express';
import { AccSubmittalsLib } from '../../libs/acc/acc.submittals';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';
import { mapUserIdsToNames } from '../../utils/acc/services.helpers';
import { getReadableState } from '../../utils/acc/submittals.helpers';

export const GetSubmittals = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    let { projectId } = req.params;
    if (projectId.startsWith("b.")) projectId = projectId.substring(2);

    const rawSubmittals = await AccSubmittalsLib.getItems(token, projectId);
    if (!Array.isArray(rawSubmittals) || rawSubmittals.length === 0) {
      return res.status(200).json({ data: { submittals: [] }, message: "No Submittals" });
    }

    const userFields = ["manager", "createdBy", "updatedBy", "submittedBy", "publishedBy", "sentToReviewBy", "respondedBy"];
    const userMap = await mapUserIdsToNames(token, projectId, rawSubmittals, userFields);

    const enrichedSubmittals = await Promise.all(rawSubmittals.map(async (item: any) => {
      let specTitle = "No Spec";
      let specIdentifier = null;
      
      if (item.specId) {
        const spec = await AccSubmittalsLib.getSpecDetail(token, projectId, item.specId);
        if (spec) {
            specTitle = spec.title;
            specIdentifier = spec.number || spec.identifier;
        }
      }

      return {
        // --- LLAVES DYNAMODB CORREGIDAS ---
        projectId: projectId,             // Partition Key
        service: `SUBMITTAL#${item.id}`,  // Sort Key

        entityType: 'submittal',
        
        id: item.id,
        identifier: item.identifier, 
        customIdentifier: item.customIdentifier,
        
        typeId: item.typeId, 
        specId: item.specId,
        specIdentifier: specIdentifier,
        specTitle: specTitle,
        subsection: item.subsection,

        title: item.title,
        description: item.description,
        priority: item.priority,
        revision: item.revision,
        
        stateId: item.stateId,
        status: getReadableState(item.stateId),

        submittedBy: userMap[item.submittedBy] || "Unknown",
        sentToReviewBy: userMap[item.sentToReviewBy] || "Unknown",
        publishedBy: userMap[item.publishedBy] || "Unknown",
        respondedBy: userMap[item.respondedBy] || null,
        createdBy: userMap[item.createdBy] || "Unknown",
        updatedBy: userMap[item.updatedBy] || "Unknown",
        manager: userMap[item.manager] || "Unknown",

        dueDate: item.dueDate || null,
        publishedDate: item.publishedDate || null,
        respondedAt: item.respondedAt || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    }));

    if (enrichedSubmittals.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, enrichedSubmittals)
        .catch(err => console.error("[DynamoDB Submittals Error]:", err));
    }

    return res.status(200).json({ data: { count: enrichedSubmittals.length, submittals: enrichedSubmittals } });

  } catch (error: any) {
    console.error("[GetSubmittals Error]:", error);
    return res.status(500).json({ error: error.message });
  }
};