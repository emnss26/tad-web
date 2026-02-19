import config from "../config";
import { DynamoLib } from "../libs/db/dynamo.lib";

const TABLE = config.aws.dynamo.tableName.management;
const KEY = {
  pk: "projectId",
  sk: "service",
};

const TASK_ENTITY = "task";

export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  assignedTo?: string;
}

function normalizeProjectId(projectId: string): string {
  if (projectId.startsWith("b.")) return projectId.substring(2);
  return projectId;
}

function normalizeAccountId(accountId: string): string {
  if (accountId.startsWith("b.")) return accountId.substring(2);
  return accountId;
}

function normalizeDate(dateValue: unknown): string | undefined {
  if (!dateValue) return undefined;

  const value = String(dateValue).trim();
  if (!value) return undefined;

  const parsed = value.length === 10
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function buildTaskSortKey(taskId: string): string {
  return `TASK#${taskId}`;
}

function cleanTaskInput(task: any): TaskRecord | null {
  if (!task || task.id == null) return null;

  const id = String(task.id).trim();
  if (!id) return null;

  const normalized: TaskRecord = {
    id,
    title: String(task.title || "").trim(),
    description: task.description ? String(task.description) : undefined,
    status: task.status ? String(task.status) : undefined,
    startDate: normalizeDate(task.startDate),
    endDate: normalizeDate(task.endDate),
    assignedTo: task.assignedTo ? String(task.assignedTo) : undefined,
  };

  if (!normalized.title) {
    normalized.title = "Untitled Task";
  }

  return normalized;
}

function mapItemToTask(item: any): TaskRecord {
  return {
    id: item.id,
    title: item.title || "Untitled Task",
    description: item.description,
    status: item.status,
    startDate: item.startDate || null,
    endDate: item.endDate || null,
    assignedTo: item.assignedTo,
  };
}

export const ManagementTaskService = {
  async getTasks(accountId: string, projectId: string): Promise<TaskRecord[]> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);

    const all = await DynamoLib.queryByPK({
      tableName: TABLE,
      pkName: KEY.pk,
      pkValue: cleanProjectId,
    });

    return (all || [])
      .filter((item: any) => item?.entityType === TASK_ENTITY && item?.accountId === cleanAccountId)
      .map(mapItemToTask)
      .sort((a, b) => a.id.localeCompare(b.id));
  },

  async upsertTasks(accountId: string, projectId: string, tasks: any[]): Promise<TaskRecord[]> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);

    const now = new Date().toISOString();

    const items = (tasks || [])
      .map(cleanTaskInput)
      .filter((task): task is TaskRecord => Boolean(task))
      .map((task) => ({
        [KEY.pk]: cleanProjectId,
        [KEY.sk]: buildTaskSortKey(task.id),
        entityType: TASK_ENTITY,
        accountId: cleanAccountId,
        taskId: task.id,
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        startDate: task.startDate,
        endDate: task.endDate,
        assignedTo: task.assignedTo,
        updatedAt: now,
        createdAt: now,
      }));

    if (!items.length) return [];

    await DynamoLib.batchWriteWithRetry(TABLE, items);
    return items.map(mapItemToTask);
  },

  async updateTask(accountId: string, projectId: string, taskId: string, payload: any): Promise<TaskRecord | null> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const cleanTaskId = String(taskId || "").trim();

    if (!cleanTaskId) return null;

    const key = {
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: buildTaskSortKey(cleanTaskId),
    };

    const existing = await DynamoLib.getItem(TABLE, key);
    if (!existing || existing.entityType !== TASK_ENTITY || existing.accountId !== cleanAccountId) {
      return null;
    }

    const merged = {
      ...existing,
      title: payload?.title != null ? String(payload.title).trim() : existing.title,
      description: payload?.description != null ? String(payload.description) : existing.description,
      status: payload?.status != null ? String(payload.status) : existing.status,
      assignedTo: payload?.assignedTo != null ? String(payload.assignedTo) : existing.assignedTo,
      updatedAt: new Date().toISOString(),
    } as any;

    if (payload?.startDate != null) {
      merged.startDate = normalizeDate(payload.startDate) || null;
    }

    if (payload?.endDate != null) {
      merged.endDate = normalizeDate(payload.endDate) || null;
    }

    if (!String(merged.title || "").trim()) {
      merged.title = "Untitled Task";
    }

    await DynamoLib.saveItem(TABLE, merged);
    return mapItemToTask(merged);
  },

  async deleteTask(accountId: string, projectId: string, taskId: string): Promise<boolean> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const cleanTaskId = String(taskId || "").trim();

    if (!cleanTaskId) return false;

    const key = {
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: buildTaskSortKey(cleanTaskId),
    };

    const existing = await DynamoLib.getItem(TABLE, key);
    if (!existing || existing.entityType !== TASK_ENTITY || existing.accountId !== cleanAccountId) {
      return false;
    }

    await DynamoLib.deleteItem(TABLE, key);
    return true;
  },
};