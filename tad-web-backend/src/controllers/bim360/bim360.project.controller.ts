import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Bim360AdminLib } from '../../libs/bim360/bim360.admin';
import { getToken } from '../../utils/auth/auth.utils';

// Definimos la interfaz para extender ParamsDictionary y evitar el error de TS
interface ProjectParams extends ParamsDictionary {
  projectId: string;
}

/**
 * Obtiene la información detallada de un proyecto BIM360
 * Ruta: GET /api/bim360/projects/:projectId
 */
export const GetBim360Project = async (req: Request<ProjectParams>, res: Response) => {
  try {
    // 1. Obtener Token
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required. Please login again.",
      });
    }

    // 2. Validar Params
    const { projectId } = req.params;

    // Limpieza defensiva: BIM360 a veces usa prefijo 'b.' en otros endpoints
    const cleanProjectId = projectId.startsWith('b.') ? projectId.substring(2) : projectId;

    if (!cleanProjectId) {
      return res.status(400).json({
        data: null,
        error: "Bad Request",
        message: "Project ID is required",
      });
    }

    // 3. Llamar a la librería
    // Asegúrate de que en tu Bim360AdminLib el método se llame 'getProjectDetails' para mantener simetría
    const projectData = await Bim360AdminLib.getProjectDetail(token, cleanProjectId);

    // 4. Responder con la misma estructura que ACC
    return res.status(200).json({
      data: projectData,
      error: null,
      message: "BIM360 Project details retrieved successfully",
    });

  } catch (error: any) {
    console.error("[GetBim360Project Error]:", error);
    const statusCode = error.message?.includes("401") ? 401 : 500;
    
    return res.status(statusCode).json({
      data: null,
      error: error.message || "Internal Server Error",
      message: "Error retrieving project details",
    });
  }
};