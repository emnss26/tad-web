import { Request, Response } from 'express';
import { DataManagementLib } from '../../libs/dm/data.management';
import { Bim360AdminLib } from '../../libs/bim360/bim360.admin';
import { getToken } from '../../utils/auth/auth.utils';
import { config } from '../../config';

export const GetBim360Projects = async (req: Request, res: Response) => {

    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required. Please login again.",
      });
    }

    try {
      // 1. Retrieve user hubs (Data Management API is still best for discovery)
      const hubsData = await DataManagementLib.getHubs(token);
      const hubsList = hubsData.data || [];

      // 2. Filter strictly by authorized hubs from config
      const authorizedHubIds = (config.accessControl.authorizedHubs || []).map((h: any) => h.id);
      const targetHubs = hubsList.filter((hub: any) => authorizedHubIds.includes(hub.id));

      if (targetHubs.length === 0) {
        return res.status(404).json({
          data: null,
          error: "Hub not found",
          message: "No authorized hubs found for this user.",
        });
      }

      // 3. Fetch projects from each authorized hub in parallel using Admin Lib
      const projectsPromises = targetHubs.map(async (hub: any) => {
        try {
          // Note: Hub ID format is "b.guid", Account ID is just "guid". We strip the prefix.
          const accountId = hub.id.replace(/^b\./, '');
          
          // Pagination is handled automatically by the Lib helper
          // Usamos 'getAccountProjects' para mantener simetría con ACC
          const projects = await Bim360AdminLib.getProjects(token, accountId);
          const normalized = Array.isArray(projects) ? projects : [];
          return normalized.map((project: any) => ({
            ...project,
            accountId,
            relationships: project.relationships || { hub: { data: { id: hub.id } } },
            hubId: hub.id,
          }));
        } catch (error: any) {
          console.error(`Error fetching BIM360 projects for hub ${hub.id}:`, error.message);
          return [];
        }
      });

      const projectsArrays = await Promise.all(projectsPromises);
      const allProjects = projectsArrays.flat();
      const dedupMap = new Map<string, any>();
      allProjects.forEach((project: any) => {
        if (!project?.id) return;
        if (!dedupMap.has(project.id)) dedupMap.set(project.id, project);
      });
      const dedupedProjects = Array.from(dedupMap.values());

      // 4. Filter specifically for BIM360 Projects
      // La API de HQ (Bim360) a veces devuelve proyectos ACC, debemos filtrarlos.
      const bim360Projects = dedupedProjects.filter((project: any) => {
        return project.projectType === 'BIM360' || project.platform === 'bim360'; 
      });

      // 5. Return standardized response
      return res.status(200).json({
        data: { 
            count: bim360Projects.length,
            projects: bim360Projects 
        },
        error: null,
        message: "BIM360 Projects retrieved successfully",
      });

    } catch (error: any) {
      console.error("Error in GetBim360Projects:", error.message || error);
      res.status(500).json({
        data: null,
        error: error.message,
        message: "Internal server error retrieving BIM360 projects",
      });
    }
  }
