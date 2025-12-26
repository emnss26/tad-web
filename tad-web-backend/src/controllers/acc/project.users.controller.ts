import { Request, Response } from 'express';
import { AccAdminLib } from '../../libs/acc/acc.admin';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib'; 
import { config } from '../../config';

export const GetProjectUsers = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    console.log ("Token", token )

    let { projectId } = req.params;
    
    // Limpieza de ID
    if (projectId.startsWith("b.")) projectId = projectId.substring(2);

    if (!projectId ) {
      return res.status(400).json({ error: "Bad Request", message: "Missing params" });
    }

    // Fetch API
    const usersData = await AccAdminLib.getProjectUsers(token, projectId);

    console.log("Users data", usersData)

    // Mapeo DB
    const enrichedUsers = usersData.map((user: any) => {
        const companyName = user.companyName || 'N/A';
        const rolesArray = user.roles || [];
        const roleNamesString = rolesArray.map((r: any) => r.name).join(', ') || 'No Role';
        
        return {
            // --- LLAVES DYNAMODB CORREGIDAS ---
            projectId: projectId,          // Partition Key (Antes pk)
            service: `USER#${user.email}`, // Sort Key (Antes sk)
            
            // Datos
            entityType: 'user',
            
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName, 
            lastName: user.lastName,
            companyName: companyName,
            status: user.status, 
            roles: rolesArray,       
            roleNames: roleNamesString,
            updatedAt: new Date().toISOString()
        };
    });

    // Guardar DB
    if (enrichedUsers.length > 0) {
        DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, enrichedUsers)
            .catch(err => console.error("[DynamoDB Users Error]:", err));
    }

    return res.status(200).json({
      data: { count: enrichedUsers.length, users: enrichedUsers },
      error: null,
      message: "Project users fetched and synced successfully",
    });

  } catch (error: any) {
    console.error("[GetProjectUsers Error]:", error);
    const statusCode = error.message?.includes("401") ? 401 : 500;
    return res.status(statusCode).json({ error: error.message || "Internal Server Error" });
  }
};