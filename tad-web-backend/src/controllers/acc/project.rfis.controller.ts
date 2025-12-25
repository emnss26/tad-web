import { Request, Response } from 'express';
import { AccRfisLib } from '../../libs/acc/acc.rfis';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';
import { mapUserIdsToNames } from '../../utils/acc/services.helpers';

export const GetRfis = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    let { projectId } = req.params;
    const { accountId } = req.params;
    if (projectId.startsWith("b.")) projectId = projectId.substring(2);

    // 1. Fetch
    const rawRfis = await AccRfisLib.getRfis(token, projectId);
    if (!Array.isArray(rawRfis) || rawRfis.length === 0) {
      return res.status(200).json({ data: { rfis: [] }, message: "No RFIs" });
    }

    // 2. Map Users
    const rfiUserFields = ["createdBy", "assignedTo", "managerId", "respondedBy", "reviewerId", "updatedBy", "closedBy", "answeredBy"];
    const userMap = await mapUserIdsToNames(token, projectId, rawRfis, rfiUserFields);

    // 3. Enriquecer
    const rfisEnriched = rawRfis.map((rfi: any) => {
      const discipline = Array.isArray(rfi.discipline) ? rfi.discipline.join(", ") : rfi.discipline;
      const category = Array.isArray(rfi.category) ? rfi.category.join(", ") : rfi.category;

      return {
        // DB KEYS
        pk: `PROJECT#${projectId}`,
        sk: `RFI#${rfi.id}`,
        
        entityType: 'rfi',
        accountId,
        projectId,

        // DATA REQUESTED
        id: rfi.id,
        customIdentifier: rfi.customIdentifier,
        title: rfi.title,
        question: rfi.question,
        status: rfi.status,
        priority: rfi.priority,
        discipline: discipline || "Not Specified",
        category: category || null,
        
        // Usuarios Enriquecidos
        managerName: userMap[rfi.managerId] || "Unknown",
        assignedToName: userMap[rfi.assignedTo] || "Unassigned", // Ojo: renombrado a 'Name' para claridad, o dejalo como assignedTo
        reviewerName: userMap[rfi.reviewerId] || "Unknown",
        respondedBy: userMap[rfi.respondedBy] || null,
        answeredBy: userMap[rfi.answeredBy] || null,
        createdBy: userMap[rfi.createdBy] || "Unknown",
        updatedBy: userMap[rfi.updatedBy] || "Unknown",
        closedBy: userMap[rfi.closedBy] || null,

        // Fechas
        dueDate: rfi.dueDate || null,
        respondedAt: rfi.respondedAt || null,
        createdAt: rfi.createdAt,
        updatedAt: rfi.updatedAt,
        closedAt: rfi.closedAt || null,
        answeredAt: rfi.answeredAt || null
      };
    });

    // 4. DB Sync
    if (rfisEnriched.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, rfisEnriched)
        .catch(err => console.error("DynamoDB RFIs Error", err));
    }

    return res.status(200).json({ data: { count: rfisEnriched.length, rfis: rfisEnriched } });

  } catch (error: any) {
    console.error("GetRfis Error", error);
    return res.status(500).json({ error: error.message });
  }
};