import { RequestHandler } from 'express';
import { config } from '../../config';
import { Bim360AdminLib } from '../../libs/bim360/bim360.admin';
import { Bim360RfisLib } from '../../libs/bim360/bim360.rfis';
import { DynamoLib } from '../../libs/db/dynamo.lib';
import { getToken } from '../../utils/auth/auth.utils';

interface ListRfisParams {
  projectId: string;
}

interface ListRfisQuery {
  limit?: string;
  offset?: string;
  status?: string;
  sort?: string;
  [key: string]: string | undefined;
}

interface ListRfisBody {}

interface Bim360RfiResponseItem {
  projectId: string;
  service: string;
  entityType: 'rfi';
  id: string;
  customIdentifier?: string;
  title?: string;
  question?: string;
  status?: string;
  priority?: string;
  discipline?: string | null;
  category?: string | null;
  managerName?: string | null;
  assignedToName?: string | null;
  reviewerName?: string | null;
  respondedBy?: string | null;
  answeredBy?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  closedBy?: string | null;
  dueDate?: string | null;
  respondedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  closedAt?: string | null;
  answeredAt?: string | null;
}

interface ListRfisResponse {
  data: {
    count: number;
    totalCount: number;
    rfis: Bim360RfiResponseItem[];
  };
  error: string | null;
  message: string | null;
}

const parsePaginationValue = (value?: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
};

const buildUserMap = async (
  token: string,
  projectId: string,
  items: any[],
  fieldsToScan: string[]
): Promise<Record<string, string>> => {
  const userIds = new Set<string>();

  items.forEach((item) => {
    fieldsToScan.forEach((field) => {
      if (item[field]) {
        userIds.add(item[field]);
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

export const getBim360Rfis: RequestHandler<ListRfisParams, ListRfisResponse, ListRfisBody, ListRfisQuery> = async (
  req,
  res,
  next
) => {
  try {
    const token = getToken(req);
    if (!token) {
      res.status(401).json({
        data: { count: 0, totalCount: 0, rfis: [] },
        error: 'Unauthorized',
        message: 'Missing access token'
      });
      return;
    }

    let { projectId } = req.params;
    if (projectId.startsWith('b.')) {
      projectId = projectId.substring(2);
    }

    const { limit, offset, ...filters } = req.query;
    const limitValue = parsePaginationValue(limit);
    const offsetValue = parsePaginationValue(offset) || 0;

    const rawRfis = await Bim360RfisLib.getRfis(token, projectId, filters);
    if (!Array.isArray(rawRfis) || rawRfis.length === 0) {
      res.status(200).json({
        data: { count: 0, totalCount: 0, rfis: [] },
        error: null,
        message: 'No RFIs'
      });
      return;
    }

    const rfiUserFields = [
      'createdBy',
      'assignedTo',
      'managerId',
      'respondedBy',
      'reviewerId',
      'updatedBy',
      'closedBy',
      'answeredBy'
    ];
    const userMap = await buildUserMap(token, projectId, rawRfis, rfiUserFields);

    const rfisEnriched = rawRfis.map((rfi: any): Bim360RfiResponseItem => {
      const discipline = Array.isArray(rfi.discipline) ? rfi.discipline.join(', ') : rfi.discipline;
      const category = Array.isArray(rfi.category) ? rfi.category.join(', ') : rfi.category;

      return {
        projectId: projectId,
        service: `RFI#${rfi.id}`,
        entityType: 'rfi',
        id: rfi.id,
        customIdentifier: rfi.customIdentifier,
        title: rfi.title,
        question: rfi.question,
        status: rfi.status,
        priority: rfi.priority,
        discipline: discipline || 'Not Specified',
        category: category || null,
        managerName: userMap[rfi.managerId] || 'Unknown',
        assignedToName: userMap[rfi.assignedTo] || 'Unassigned',
        reviewerName: userMap[rfi.reviewerId] || 'Unknown',
        respondedBy: userMap[rfi.respondedBy] || null,
        answeredBy: userMap[rfi.answeredBy] || null,
        createdBy: userMap[rfi.createdBy] || 'Unknown',
        updatedBy: userMap[rfi.updatedBy] || 'Unknown',
        closedBy: userMap[rfi.closedBy] || null,
        dueDate: rfi.dueDate || null,
        respondedAt: rfi.respondedAt || null,
        createdAt: rfi.createdAt || null,
        updatedAt: rfi.updatedAt || null,
        closedAt: rfi.closedAt || null,
        answeredAt: rfi.answeredAt || null
      };
    });

    if (rfisEnriched.length > 0) {
      DynamoLib.batchWrite(config.aws.dynamo.tableName.projects, rfisEnriched).catch((err) =>
        console.error('[DynamoDB BIM360 RFIs Error]:', err)
      );
    }

    const totalCount = rfisEnriched.length;
    const paginatedRfis =
      limitValue !== undefined ? rfisEnriched.slice(offsetValue, offsetValue + limitValue) : rfisEnriched.slice(offsetValue);

    res.status(200).json({
      data: { count: paginatedRfis.length, totalCount, rfis: paginatedRfis },
      error: null,
      message: 'RFIs fetched successfully'
    });
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      error.status = status;
      return next(error);
    }

    console.error('[GetBim360Rfis Error]:', error);
    res.status(500).json({
      data: { count: 0, totalCount: 0, rfis: [] },
      error: error.message || 'Internal Server Error',
      message: 'Error fetching BIM360 RFIs'
    });
  }
};
