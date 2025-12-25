import { Request, Response } from 'express';
import { AccAdminLib } from '../../libs/acc/acc.admin';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib'; 
import { config } from '../../config';

/**
 * GetProjectUsers
 * Obtiene la lista completa de usuarios de un proyecto ACC y sincroniza con DynamoDB.
 * Ruta: GET /api/acc/accounts/:accountId/projects/:projectId/users
 */
export const GetProjectUsers = async (req: Request, res: Response) => {
  try {
    // 1. Obtener Token
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    // 2. Obtener Parámetros
    const { accountId, projectId } = req.params;

    if (!projectId || !accountId) {
      return res.status(400).json({
        data: null,
        error: "Bad Request",
        message: "Project ID and Account ID are required",
      });
    }

    // 3. Llamar a la librería (Autodesk Admin API)
    // Esto obtiene los datos frescos de Autodesk (paginados automágicamente por la Lib)
    const usersData = await AccAdminLib.getProjectUsers(token, projectId);

    // 4. Mapeo de datos para Frontend y Base de Datos
    // Seleccionamos solo ID, Email, Name, Company, Roles y Status
    const enrichedUsers = usersData.map((user: any) => {
        // Normalizamos campos para evitar undefineds
        const companyName = user.companyName || 'N/A';
        
        // Roles viene como array [{id, name}], creamos un string amigable para la tabla
        const rolesArray = user.roles || [];
        const roleNamesString = rolesArray.map((r: any) => r.name).join(', ') || 'No Role';
        
        return {
            // --- LLAVES DYNAMODB ---
            // PK: Agrupamos por Proyecto para poder hacer "Query users where PK = PROJECT#123"
            pk: `PROJECT#${projectId}`, 
            // SK: Identificamos por Usuario único (Email)
            sk: `USER#${user.email}`,
            
            // --- DATOS DEL NEGOCIO (Los que pediste) ---
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName, // Útil para avatares
            lastName: user.lastName,
            
            companyName: companyName,
            status: user.status, // active, pending, etc.
            
            roles: rolesArray,       // Array original (para lógica de permisos)
            roleNames: roleNamesString, // String (para mostrar en tabla UI)
            
            // Metadata de auditoría
            entityType: 'user',
            accountId: accountId,
            projectId: projectId,
            updatedAt: new Date().toISOString()
        };
    });

    // 5. SINCRONIZACIÓN CON DYNAMODB (Tabla de Proyectos)
    if (enrichedUsers.length > 0) {
        // Ejecutamos la escritura asíncrona pero sin detener la respuesta si falla
        // Usamos la tabla definida en DYNAMODB_TABLE_PROJECTS
        DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, enrichedUsers)
            .then(() => console.log(`[DynamoDB] Synced ${enrichedUsers.length} users for project ${projectId}`))
            .catch(err => console.error("[DynamoDB Sync Error]:", err));
    }

    // 6. Respuesta al Frontend
    return res.status(200).json({
      data: {
        count: enrichedUsers.length,
        users: enrichedUsers, // Enviamos el array limpio y mapeado
      },
      error: null,
      message: "Project users fetched and synced successfully",
    });

  } catch (error: any) {
    console.error("[GetProjectUsers Error]:", error);
    const statusCode = error.message?.includes("401") ? 401 : 500;
    
    return res.status(statusCode).json({
      data: null,
      error: error.message || "Internal Server Error",
      message: "Error accessing project users",
    });
  }
};