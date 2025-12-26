import { Request, Response } from 'express';
import { AccAdminLib } from '../../libs/acc/acc.admin';
import { getToken } from '../../utils/auth/auth.utils';
// import { DynamoLib } from '../../libs/db/dynamo.lib';  // Comentado para debugging
// import { config } from '../../config'; // Comentado para debugging

export const GetProjectUsers = async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Debug Logs
    console.log("[GetProjectUsers] Token presente.");

    let { projectId } = req.params;
    
    // Limpieza de ID
    if (projectId.startsWith("b.")) projectId = projectId.substring(2);

    if (!projectId ) {
      return res.status(400).json({ error: "Bad Request", message: "Missing params" });
    }

    console.log(`[GetProjectUsers] Fetching users for Project: ${projectId}`);

    // Fetch API
    const usersData = await AccAdminLib.getProjectUsers(token, projectId);

    console.log(`[GetProjectUsers] Fetched ${usersData.length} users from Autodesk.`);

    // Mapeo de datos (Mantenemos esto para verificar que no haya errores de sintaxis aquí)
    const enrichedUsers = usersData.map((user: any) => {
        const companyName = user.companyName || 'N/A';
        const rolesArray = user.roles || [];
        const roleNamesString = rolesArray.map((r: any) => r.name).join(', ') || 'No Role';
        
        return {
            // Estructura de datos
            projectId: projectId,          
            service: `USER#${user.email}`, 
            
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

    // --- SECCIÓN DE BASE DE DATOS DESACTIVADA TEMPORALMENTE ---
    /*
    if (enrichedUsers.length > 0) {
        DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, enrichedUsers)
            .catch(err => console.error("[DynamoDB Users Error]:", err));
    }
    */
    // -----------------------------------------------------------

    console.log("[GetProjectUsers] Sending response to frontend...");

    return res.status(200).json({
      data: { count: enrichedUsers.length, users: enrichedUsers },
      error: null,
      message: "Project users fetched successfully (DB Sync Disabled)",
    });

  } catch (error: any) {
    console.error("[GetProjectUsers Error]:", error);
    const statusCode = error.message?.includes("401") ? 401 : 500;
    return res.status(statusCode).json({ error: error.message || "Internal Server Error" });
  }
};