import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Bim360RfisLib } from '../../libs/bim360/bim360.rfis';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';
import { mapUserIdsToNames } from '../../utils/acc/services.helpers';

interface RfiParams extends ParamsDictionary {
  projectId: string;
}

export const GetBim360Rfis = async (req: Request<RfiParams>, res: Response) => {
  try {
    // 1. Auth
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

    // 3. Fetch from BIM360
    // Pasamos req.query para soportar filtros si la librería lo permite
    const rawRfis = await Bim360RfisLib.getRfis(token, projectId, req.query);

    if (!Array.isArray(rawRfis) || rawRfis.length === 0) {
      return res.status(200).json({ 
        data: { count: 0, rfis: [] }, 
        error: null, 
        message: "No BIM360 RFIs found" 
      });
    }

    // 4. User Mapping (Enriquecimiento)
    const rfiUserFields = [
        "createdBy", "assignedTo", "managerId", "respondedBy", 
        "reviewerId", "updatedBy", "closedBy", "answeredBy"
    ];
    const userMap = await mapUserIdsToNames(token, projectId, rawRfis, rfiUserFields);

    // 5. Data Normalization & DB Schema Mapping
    const rfisEnriched = rawRfis.map((rfi: any) => {
      // Flatten arrays if necessary (API inconsistencies handling)
      const discipline = Array.isArray(rfi.discipline) ? rfi.discipline.join(", ") : rfi.discipline;
      const category = Array.isArray(rfi.category) ? rfi.category.join(", ") : rfi.category;

      return {
        // --- KEYS DYNAMODB ---
        projectId: projectId,           // Partition Key
        service: `RFI#${rfi.id}`,       // Sort Key
        
        entityType: 'rfi',
        
        id: rfi.id,
        customIdentifier: rfi.customIdentifier || rfi.identifier, // Fallback por si cambia el nombre del campo
        title: rfi.title,
        question: rfi.question,
        status: rfi.status,
        priority: rfi.priority,
        discipline: discipline || "Not Specified",
        category: category || null,
        
        // Mapeo de Nombres
        managerName: userMap[rfi.managerId] || "Unknown",
        assignedToName: userMap[rfi.assignedTo] || "Unassigned",
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

    // 6. DB Sync
    if (rfisEnriched.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, rfisEnriched)
        .catch(err => console.error("[DynamoDB BIM360 RFIs Error]:", err));
    }

    // 7. Response
    return res.status(200).json({
      data: { 
        count: rfisEnriched.length, 
        rfis: rfisEnriched 
      },
      error: null,
      message: "BIM360 RFIs fetched and synced successfully",
    });

  } catch (error: any) {
    console.error("[GetBim360Rfis Error]:", error);
    const statusCode = error.message?.includes("401") ? 401 : 500;
    
    return res.status(statusCode).json({
      data: null,
      error: error.message || "Internal Server Error",
      message: "Error retrieving BIM360 RFIs",
    });
  }
};