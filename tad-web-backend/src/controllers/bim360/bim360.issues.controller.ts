import { NextFunction, RequestHandler } from 'express';
import { Bim360IssuesLib } from '../../libs/bim360/bim360.issues';
import { Bim360AdminLib } from '../../libs/bim360/bim360.admin';
import { getToken } from '../../utils/auth/auth.utils';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { config } from '../../config';
import {
  buildCustomAttributeValueMap,
  enrichCustomAttributes,
} from '../../utils/acc/services.helpers';

interface IssuesParams {
  projectId: string;
}

interface IssuesQuery {
  [key: string]: string | string[] | undefined;
}

interface EmptyBody {}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message: string | null;
}

interface IssueType {
  id: string;
  title: string;
  [key: string]: unknown;
}

interface IssueAttributeDefinition {
  id: string;
  metadata?: {
    list?: {
      options?: Array<{ id: string; value: string }>;
    };
  };
  [key: string]: unknown;
}

interface IssueRecord {
  projectId: string;
  service: string;
  entityType: 'issue';
  id: string;
  displayId?: string;
  title?: string;
  description?: string;
  status?: string;
  issueTypeId?: string;
  issueTypeName?: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  startDate: string | null;
  closedAt: string | null;
  openedAt: string | null;
  createdBy: string;
  assignedTo: string;
  closedBy: string | null;
  openedBy: string | null;
  updatedBy: string | null;
  ownerId: string | null;
  rootCause: string | null;
  customAttributes: unknown[];
}

interface IssuesResponsePayload {
  count: number;
  issues: IssueRecord[];
}

interface IssueTypesResponsePayload {
  issueTypes: IssueType[];
}

interface AttributeDefinitionsResponsePayload {
  definitions: IssueAttributeDefinition[];
}

const mapUserIdsToNames = async (
  token: string,
  projectId: string,
  issues: Array<Record<string, any>>,
  fieldsToScan: string[] = ['createdBy', 'assignedTo', 'closedBy', 'openedBy', 'updatedBy', 'ownerId']
): Promise<Record<string, string>> => {
  const userIds = new Set<string>();

  issues.forEach((issue) => {
    fieldsToScan.forEach((field) => {
      if (issue[field]) {
        userIds.add(issue[field]);
      }
    });
  });

  const userMap: Record<string, string> = {};
  await Promise.all(
    Array.from(userIds).map(async (userId) => {
      try {
        const user = await Bim360AdminLib.getProjectUserDetail(token, projectId, userId);
        const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
        userMap[userId] = name || 'Unknown User';
      } catch (error) {
        userMap[userId] = 'Unknown User';
      }
    })
  );

  return userMap;
};

const normalizeIssues = (data: unknown): Array<Record<string, any>> => {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    const typedData = data as { results?: Array<Record<string, any>>; data?: Array<Record<string, any>> };
    if (Array.isArray(typedData.results)) {
      return typedData.results;
    }
    if (Array.isArray(typedData.data)) {
      return typedData.data;
    }
  }
  return [];
};

const normalizeIssueTypes = (data: unknown): IssueType[] => {
  if (Array.isArray(data)) {
    return data as IssueType[];
  }
  if (data && typeof data === 'object') {
    const typedData = data as { results?: IssueType[]; data?: IssueType[] };
    return typedData.results || typedData.data || [];
  }
  return [];
};

const normalizeAttributeDefinitions = (data: unknown): IssueAttributeDefinition[] => {
  if (Array.isArray(data)) {
    return data as IssueAttributeDefinition[];
  }
  if (data && typeof data === 'object') {
    const typedData = data as { results?: IssueAttributeDefinition[]; data?: IssueAttributeDefinition[] };
    return typedData.results || typedData.data || [];
  }
  return [];
};

export const getIssues: RequestHandler<
  IssuesParams,
  ApiResponse<IssuesResponsePayload>,
  EmptyBody,
  IssuesQuery
> = async (req, res, next: NextFunction) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({
        data: null,
        error: 'Unauthorized',
        message: 'Missing Autodesk access token',
      });
      return;
    }

    let { projectId } = req.params;
    if (projectId.startsWith('b.')) {
      projectId = projectId.substring(2);
    }

    const [rawIssues, issueTypesData, attrDefinitionsData] = await Promise.all([
      Bim360IssuesLib.getIssues(token, projectId, req.query),
      Bim360IssuesLib.getIssueTypes(token, projectId),
      Bim360IssuesLib.getAttributeDefinitions(token, projectId),
    ]);

    const issues = normalizeIssues(rawIssues);
    if (issues.length === 0) {
      res.status(200).json({
        data: { count: 0, issues: [] },
        error: null,
        message: 'No Issues found',
      });
      return;
    }

    const issueTypes = normalizeIssueTypes(issueTypesData);
    const issueTypeMap = issueTypes.reduce<Record<string, string>>((accumulator, type) => {
      if (type.id) {
        accumulator[type.id] = type.title || 'Unknown Type';
      }
      return accumulator;
    }, {});

    const attributeDefinitions = normalizeAttributeDefinitions(attrDefinitionsData);
    const attributeValueMap = buildCustomAttributeValueMap(attributeDefinitions);
    const userMap = await mapUserIdsToNames(token, projectId, issues);
    const issuesWithAttributes = enrichCustomAttributes(issues, attributeValueMap);

    const dbItems = issuesWithAttributes.map((issue) => {
      const createdAt = issue.createdAt ? new Date(issue.createdAt).toISOString() : new Date().toISOString();
      const updatedAt = issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString();

      return {
        projectId,
        service: `ISSUE#${issue.id}`,
        entityType: 'issue',
        id: issue.id,
        displayId: issue.displayId,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        issueTypeId: issue.issueTypeId,
        issueTypeName: issueTypeMap[issue.issueTypeId] || 'Unknown Type',
        createdAt,
        updatedAt,
        dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString() : null,
        startDate: issue.startDate ? new Date(issue.startDate).toISOString() : null,
        closedAt: issue.closedAt ? new Date(issue.closedAt).toISOString() : null,
        openedAt: issue.openedAt ? new Date(issue.openedAt).toISOString() : null,
        createdBy: userMap[issue.createdBy] || 'Unknown User',
        assignedTo: userMap[issue.assignedTo] || 'Unassigned',
        closedBy: userMap[issue.closedBy] || null,
        openedBy: userMap[issue.openedBy] || null,
        updatedBy: userMap[issue.updatedBy] || null,
        ownerId: userMap[issue.ownerId] || null,
        rootCause: issue.rootCauseId || null,
        customAttributes: issue.customAttributes || [],
      } as IssueRecord;
    });

    if (dbItems.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, dbItems)
        .catch((err) => console.error('[DynamoDB Issues Error]:', err));
    }

    res.status(200).json({
      data: { count: dbItems.length, issues: dbItems },
      error: null,
      message: 'Issues fetched and synced successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getIssueTypes: RequestHandler<
  IssuesParams,
  ApiResponse<IssueTypesResponsePayload>,
  EmptyBody
> = async (req, res, next: NextFunction) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({
        data: null,
        error: 'Unauthorized',
        message: 'Missing Autodesk access token',
      });
      return;
    }

    let { projectId } = req.params;
    if (projectId.startsWith('b.')) {
      projectId = projectId.substring(2);
    }

    const issueTypesData = await Bim360IssuesLib.getIssueTypes(token, projectId);
    const issueTypes = normalizeIssueTypes(issueTypesData);

    res.status(200).json({
      data: { issueTypes },
      error: null,
      message: 'Issue types retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getIssueAttributeDefinitions: RequestHandler<
  IssuesParams,
  ApiResponse<AttributeDefinitionsResponsePayload>,
  EmptyBody
> = async (req, res, next: NextFunction) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({
        data: null,
        error: 'Unauthorized',
        message: 'Missing Autodesk access token',
      });
      return;
    }

    let { projectId } = req.params;
    if (projectId.startsWith('b.')) {
      projectId = projectId.substring(2);
    }

    const attrDefinitionsData = await Bim360IssuesLib.getAttributeDefinitions(token, projectId);
    const definitions = normalizeAttributeDefinitions(attrDefinitionsData);

    res.status(200).json({
      data: { definitions },
      error: null,
      message: 'Issue attribute definitions retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
