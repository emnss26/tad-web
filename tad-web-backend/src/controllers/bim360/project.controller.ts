import { Request, Response, NextFunction } from 'express';
import { Bim360AdminLib } from '../../libs/bim360/bim360.admin';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';

interface GetProjectsQuery {
  hubId?: string;
  accountId?: string;
}

interface Bim360Project {
  id: string;
  name?: string;
  status?: string;
  accountId?: string;
  hubId?: string;
  account_id?: string;
  hub_id?: string;
  project_name?: string;
  project_status?: string;
  [key: string]: unknown;
}

interface ProjectsResponse {
  count: number;
  projects: Bim360Project[];
}

interface SyncProjectsBody {
  project?: Bim360Project;
  projects?: Bim360Project[];
  hubId?: string;
  accountId?: string;
}

const normalizeAccountId = (value: string) => value.replace(/^b\./, '');

const resolveAccountId = (query: GetProjectsQuery) => {
  if (query.accountId) {
    return normalizeAccountId(query.accountId);
  }

  if (query.hubId) {
    return normalizeAccountId(query.hubId);
  }

  return null;
};

const matchesAccountFilter = (project: Bim360Project, accountId: string, hubId?: string) => {
  const projectAccountId = project.accountId || project.account_id || (project.hubId ? normalizeAccountId(project.hubId) : undefined);
  const projectHubId = project.hubId || project.hub_id;

  if (hubId) {
    return projectHubId === hubId || projectAccountId === normalizeAccountId(hubId);
  }

  return projectAccountId === accountId;
};

const mapProjectToDynamoItem = (project: Bim360Project, accountId?: string, hubId?: string) => {
  const resolvedAccountId = project.accountId || project.account_id || (hubId ? normalizeAccountId(hubId) : undefined) || accountId;
  const resolvedHubId = project.hubId || project.hub_id || (resolvedAccountId ? `b.${resolvedAccountId}` : undefined);

  return {
    projectId: project.id,
    service: `PROJECT#${project.id}`,
    entityType: 'project',
    id: project.id,
    name: project.name || project.project_name || 'Unnamed Project',
    status: project.status || project.project_status || null,
    accountId: resolvedAccountId,
    hubId: resolvedHubId,
    raw: project,
    updatedAt: new Date().toISOString()
  };
};

export class Bim360ProjectController {
  public static async getProjects(
    req: Request<unknown, ProjectsResponse, unknown, GetProjectsQuery>,
    res: Response<ProjectsResponse>,
    next: NextFunction
  ) {
    const token = getToken(req);

    if (!token) {
      res.status(401).json({
        count: 0,
        projects: []
      });
      return;
    }

    const accountId = resolveAccountId(req.query);

    if (!accountId) {
      res.status(400).json({
        count: 0,
        projects: []
      });
      return;
    }

    try {
      const projects = await Bim360AdminLib.getProjects(token, accountId);
      const normalizedProjects = Array.isArray(projects) ? projects : [];
      const filteredProjects = normalizedProjects.filter((project: Bim360Project) =>
        matchesAccountFilter(project, accountId, req.query.hubId)
      );

      res.status(200).json({
        count: filteredProjects.length,
        projects: filteredProjects
      });
    } catch (error) {
      console.error('[Bim360ProjectController.getProjects] Error:', error);
      next(error);
    }
  }

  public static async syncProjects(
    req: Request<unknown, { synced: number }, SyncProjectsBody>,
    res: Response<{ synced: number }>,
    next: NextFunction
  ) {
    const { project, projects, hubId, accountId } = req.body;
    const incomingProjects = projects ?? (project ? [project] : []);

    if (incomingProjects.length === 0) {
      res.status(400).json({ synced: 0 });
      return;
    }

    try {
      const dbItems = incomingProjects.map((item) => mapProjectToDynamoItem(item, accountId, hubId));
      await DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, dbItems);

      res.status(200).json({
        synced: dbItems.length
      });
    } catch (error) {
      console.error('[Bim360ProjectController.syncProjects] Error:', error);
      next(error);
    }
  }
}
