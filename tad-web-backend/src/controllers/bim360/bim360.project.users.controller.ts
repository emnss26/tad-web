import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Bim360AdminLib } from '../../libs/bim360/bim360.admin';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';

interface UserParams extends ParamsDictionary {
  projectId: string;
}

export const GetBim360ProjectUsers = async (req: Request<UserParams>, res: Response) => {
  try {
    // 1. Obtener Token
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ 
        data: null, 
        error: "Unauthorized", 
        message: "Authorization token is required." 
      });
    }

    // 2. Limpieza de ID
    let { projectId } = req.params;
    if (projectId.startsWith('b.')) projectId = projectId.substring(2);

    if (!projectId) {
      return res.status(400).json({ 
        data: null, 
        error: "Bad Request", 
        message: "Project ID is required" 
      });
    }

    // 3. Fetch API (BIM360)
    // Asegúrate de que Bim360AdminLib.getProjectUsers maneje la paginación internamente
    const usersData = await Bim360AdminLib.getProjectUsers(token, projectId);

    // 4. Mapeo y Enriquecimiento para DynamoDB (Igual que ACC)
    const enrichedUsers = usersData.map((user: any) => {
        const companyName = user.companyName || 'N/A';
        const rolesArray = user.roles || [];
        // BIM360 a veces devuelve roles como strings simples o objetos, verificamos:
        const roleNamesString = Array.isArray(rolesArray) 
            ? rolesArray.map((r: any) => (typeof r === 'string' ? r : r.name)).join(', ') 
            : 'No Role';
        
        return {
            // --- KEYS DYNAMODB ---
            projectId: projectId,           // Partition Key
            service: `USER#${user.email}`, // Sort Key
            
            // Datos
            entityType: 'user',
            
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            firstName: user.firstName, 
            lastName: user.lastName,
            companyName: companyName,
            status: user.status, 
            roles: rolesArray,       
            roleNames: roleNamesString,
            updatedAt: new Date().toISOString()
        };
    });

    // 5. Sincronización con DynamoDB (Fire and Forget)
    if (enrichedUsers.length > 0) {
        DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, enrichedUsers)
            .catch(err => console.error("[DynamoDB BIM360 Users Error]:", err));
    }

    // 6. Respuesta Exitosa
    return res.status(200).json({
      data: { count: enrichedUsers.length, users: enrichedUsers },
      error: null,
      message: "BIM360 Users fetched and synced successfully",
    });

  } catch (error: any) {
    console.error("[GetBim360ProjectUsers Error]:", error);
    const statusCode = error.message?.includes("401") ? 401 : 500;
    
    return res.status(statusCode).json({
      data: null,
      error: error.message || "Internal Server Error",
      message: "Error retrieving project users",
    });
  }
};