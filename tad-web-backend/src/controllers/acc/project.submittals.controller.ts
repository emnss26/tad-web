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
    const { accountId } = req.params;
    if (projectId.startsWith("b.")) projectId = projectId.substring(2);

    // 1. Fetch Items
    const rawSubmittals = await AccSubmittalsLib.getItems(token, projectId);
    if (!Array.isArray(rawSubmittals) || rawSubmittals.length === 0) {
      return res.status(200).json({ data: { submittals: [] }, message: "No Submittals" });
    }

    // 2. Map Users
    const userFields = ["manager", "createdBy", "updatedBy", "submittedBy", "publishedBy", "sentToReviewBy", "respondedBy"];
    const userMap = await mapUserIdsToNames(token, projectId, rawSubmittals, userFields);

    // 3. Enriquecimiento Specs (Paralelo)
    const enrichedSubmittals = await Promise.all(rawSubmittals.map(async (item: any) => {
      
      // Spec Logic
      let specTitle = "No Spec";
      let specIdentifier = null;
      
      if (item.specId) {
        // Optimization: Podríamos cachear esto, pero por ahora está bien
        const spec = await AccSubmittalsLib.getSpecDetail(token, projectId, item.specId);
        if (spec) {
            specTitle = spec.title;
            specIdentifier = spec.number || spec.identifier;
        }
      }

      return {
        // DB KEYS
        pk: `PROJECT#${projectId}`,
        sk: `SUBMITTAL#${item.id}`,
        entityType: 'submittal',
        accountId,
        projectId,

        // DATA REQUESTED
        id: item.id,
        identifier: item.identifier, // Numeric ID
        customIdentifier: item.customIdentifier,
        
        // Specs & Types
        typeId: item.typeId, // Enriquecer esto requiere otra llamada a /item-types, lo dejamos así por performance por ahora
        specId: item.specId,
        specIdentifier: specIdentifier,
        specTitle: specTitle,
        subsection: item.subsection,

        title: item.title,
        description: item.description,
        priority: item.priority,
        revision: item.revision,
        
        // Status
        stateId: item.stateId,
        status: getReadableState(item.stateId), // Enriquecido con el helper

        // Usuarios (Nombres)
        submittedBy: userMap[item.submittedBy] || "Unknown",
        sentToReviewBy: userMap[item.sentToReviewBy] || "Unknown",
        publishedBy: userMap[item.publishedBy] || "Unknown",
        respondedBy: userMap[item.respondedBy] || null,
        createdBy: userMap[item.createdBy] || "Unknown",
        updatedBy: userMap[item.updatedBy] || "Unknown",
        manager: userMap[item.manager] || "Unknown", // Campo 'manager' pedido

        // Fechas
        dueDate: item.dueDate || null,
        publishedDate: item.publishedDate || null,
        respondedAt: item.respondedAt || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    }));

    // 4. DB Sync
    if (enrichedSubmittals.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, enrichedSubmittals)
        .catch(err => console.error("DynamoDB Submittals Error", err));
    }

    return res.status(200).json({ data: { count: enrichedSubmittals.length, submittals: enrichedSubmittals } });

  } catch (error: any) {
    console.error("GetSubmittals Error", error);
    return res.status(500).json({ error: error.message });
  }
};