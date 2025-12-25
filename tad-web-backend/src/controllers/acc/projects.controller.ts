import { Request, Response } from 'express';
import { DataManagementLib } from '../../libs/dm/data.management';
import { AccAdminLib } from '../../libs/acc/acc.admin';
import { getToken } from '../../utils/auth/auth.utils';
import { config } from '../../config';

export const GetAccProjects = async (req: Request, res: Response) => {
   
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required. Please login again.",
      });
    }

    try {
      // 2. Retrieve user hubs (Data Management API is still best for discovery)
      const hubsData = await DataManagementLib.getHubs(token);
      const hubsList = hubsData.data || [];

      // 3. Filter authorized hubs based on config
      const authorizedHubIds = config.accessControl.authorizedHubs.map((h: any) => h.id);
      
      const targetHubs = hubsList.filter((hub: any) => 
        authorizedHubIds.includes(hub.id)
      );

      if (targetHubs.length === 0) {
        return res.status(404).json({
          data: null,
          error: "Hub not found",
          message: "No authorized hubs found for this user.",
        });
      }

      // 4. Fetch projects from each authorized hub in parallel using Admin Lib
      const projectsPromises = targetHubs.map(async (hub: any) => {
        try {
          // Note: Hub ID format is "b.guid", Account ID is just "guid". We strip the prefix.
          const accountId = hub.id.replace(/^b\./, '');
          
          // Pagination is handled automatically by the Lib helper
          const projects = await AccAdminLib.getAccountProjects(token, accountId);
          return Array.isArray(projects) ? projects : [];
        } catch (error: any) {
          console.error(`Error fetching projects for hub ${hub.id}:`, error.message);
          return [];
        }
      });

      const projectsArrays = await Promise.all(projectsPromises);
      const allProjects = projectsArrays.flat();
      const accProjects = allProjects.filter((project: any) => {
      return project.platform === 'acc' || !project.platform; 
      });

      // 6. Return standardized response
      return res.status(200).json({
        data: { 
            count: accProjects.length,
            projects: accProjects 
        },
        error: null,
        message: "ACC Projects retrieved successfully",
      });

    } catch (error: any) {
      console.error("Error in getAccProjects:", error.message || error);
      res.status(500).json({
        data: null,
        error: error.message,
        message: "Internal server error retrieving projects",
      });
    }
  }
