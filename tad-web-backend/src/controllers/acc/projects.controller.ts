import { Request, Response } from 'express';
import { DataManagementLib } from '../../libs/dm/data.management';
import { config } from '../../config';

export const ProjectsController = {
  /**
   * Obtiene todos los proyectos ACC de los Hubs autorizados
   */
  getAccProjects: async (req: Request, res: Response) => {
    // 1. Obtener Token de la sesión
    const session = req.session as any;
    const token = session?.token;

    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "No se encontró token de acceso. Por favor inicia sesión.",
      });
    }

    try {
      // 2. Obtener Hubs del usuario
      const hubsData = await DataManagementLib.getHubs(token);
      
      // La API devuelve { data: [...], links: ... }
      const hubsList = hubsData.data || [];

      // 3. Filtrar Hubs Autorizados (White-listing)
      const authorizedHubIds = config.accessControl.authorizedHubs.map(h => h.id);
      
      const targetHubs = hubsList.filter((hub: any) => 
        authorizedHubIds.includes(hub.id)
      );

      if (targetHubs.length === 0) {
        return res.status(404).json({
          data: null,
          error: "Hub not found",
          message: "No se encontraron Hubs autorizados para tu usuario.",
        });
      }

      // 4. Obtener Proyectos de cada Hub Autorizado en paralelo
      const projectsPromises = targetHubs.map(async (hub: any) => {
        try {
          // Solicitamos límite de 100 para traer la mayoría de una vez
          // TODO: Implementar paginación completa si tienes > 100 proyectos por Hub
          const projectsRes = await DataManagementLib.getHubProjects(token, hub.id, { 'page[limit]': 100 });
          return projectsRes.data || [];
        } catch (error: any) {
          console.error(`Error fetching projects for hub ${hub.id}:`, error.message);
          return [];
        }
      });

      const projectsArrays = await Promise.all(projectsPromises);
      
      // Aplanar el array de arrays ([[p1, p2], [p3]] -> [p1, p2, p3])
      const allProjects = projectsArrays.flat();

      // 5. Filtrar solo proyectos tipo "ACC" (Autodesk Construction Cloud)
      // Los proyectos BIM 360 clásicos a veces no tienen este atributo o es diferente.
      const accProjects = allProjects.filter((project: any) => {
        // Navegación segura en el objeto JSON API
        const projectType = project?.attributes?.extension?.data?.projectType;
        // Aceptamos 'ACC' y también 'BIM360' si quisieras, pero tu requisito es ACC
        return projectType === "ACC";
      });

      // 6. Retornar respuesta limpia
      return res.status(200).json({
        data: { 
            count: accProjects.length,
            projects: accProjects 
        },
        error: null,
        message: "Proyectos ACC obtenidos exitosamente",
      });

    } catch (error: any) {
      console.error("Error en GetProjects:", error.message || error);
      res.status(500).json({
        data: null,
        error: error.message,
        message: "Error interno al obtener los proyectos",
      });
    }
  }
};