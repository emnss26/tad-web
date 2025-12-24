import { Request, Response } from 'express';
import { AccAdminLib } from '../../libs/acc/acc.admin';
import { getToken } from '../../utils/auth/auth.utils'; 

/**
 * Obtiene la información detallada de un proyecto (Admin Context)
 * Ruta: GET /api/acc/accounts/:accountId/projects/:projectId
 */
export const GetProject = async (req: Request, res: Response) => {
  try {
    // 1. Usar el Helper (Mucho más limpio)
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required. Please login again.",
      });
    }
              
    // 2. Validar Params
    const { accountId, projectId } = req.params;

    if (!projectId || !accountId) {
      return res.status(400).json({
        data: null,
        error: "Bad Request",
        message: "Project ID and Account ID are required",
      });
    }

    // 3. Llamar a la librería
    const projectData = await AccAdminLib.getProjectDetails(token, projectId);

    // 4. Responder
    return res.status(200).json({
      data: projectData, 
      error: null,
      message: "Project details generated correctly",
    });

  } catch (error: any) {
    console.error("[GetProject Controller Error]:", error);
    const statusCode = error.message.includes("401") ? 401 : 500;
    
    return res.status(statusCode).json({
      data: null,
      error: error.message || "Internal Server Error",
      message: "Error to access the project details",
    });
  }
};