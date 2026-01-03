import { NextFunction, Request, Response } from 'express';
import { Bim360AdminLib } from '../../libs/bim360/bim360.admin';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';
import { getToken } from '../../utils/auth/auth.utils';

interface ProjectUsersParams {
  projectId: string;
}

interface ProjectUsersRequestBody {}

interface AutodeskUserRole {
  name?: string;
  [key: string]: any;
}

interface AutodeskProjectUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  status?: string;
  roles?: AutodeskUserRole[];
  [key: string]: any;
}

interface ProjectUserRecord {
  projectId: string;
  service: string;
  entityType: 'user';
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  companyName: string;
  status?: string;
  roles: AutodeskUserRole[];
  roleNames: string;
  updatedAt: string;
}

interface GetProjectUsersResponse {
  data: { count: number; users: ProjectUserRecord[] } | null;
  error: string | null;
  message: string | null;
}

export const GetBim360ProjectUsers = async (
  req: Request<ProjectUsersParams, GetProjectUsersResponse, ProjectUsersRequestBody>,
  res: Response<GetProjectUsersResponse>,
  next: NextFunction
) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: 'Unauthorized',
        message: 'Authorization token is required. Please login again.',
      });
    }

    const rawProjectId = req.params.projectId;
    if (!rawProjectId) {
      return res.status(400).json({
        data: null,
        error: 'Bad Request',
        message: 'Missing project id parameter.',
      });
    }

    const projectId = rawProjectId.startsWith('b.') ? rawProjectId.substring(2) : rawProjectId;
    const usersData = (await Bim360AdminLib.getProjectUsers(token, projectId)) as AutodeskProjectUser[];

    const enrichedUsers: ProjectUserRecord[] = usersData.map((user) => {
      const companyName = user.companyName || 'N/A';
      const rolesArray = user.roles || [];
      const roleNamesString = rolesArray.map((role) => role.name).join(', ') || 'No Role';

      return {
        projectId,
        service: `USER#${user.email}`,
        entityType: 'user',
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName,
        status: user.status,
        roles: rolesArray,
        roleNames: roleNamesString,
        updatedAt: new Date().toISOString(),
      };
    });

    if (enrichedUsers.length > 0) {
      await DynamoLib.batchWrite(config.aws.dynamo.tableName.master, enrichedUsers);
    }

    return res.status(200).json({
      data: { count: enrichedUsers.length, users: enrichedUsers },
      error: null,
      message: 'BIM360 project users fetched and synced successfully',
    });
  } catch (error) {
    console.error('[GetBim360ProjectUsers Error]:', error);
    next(error);
  }
};
