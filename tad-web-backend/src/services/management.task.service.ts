import config from "../config";
import { DynamoLib } from "../libs/db/dynamo.lib";
import { normalizeIsoDate, normalizeProjectId, normalizeTaskId } from "../utils/db/dynamo.keys";

const TABLE = config.aws.dynamo.tableName.tasks;
const KEY = {
  pk: "projectId",
  sk: "taskId",
};

export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  assignedTo?: string;
}

function normalizeAccountId(accountId: string): string {
  if (accountId.startsWith("b.")) return accountId.substring(2);
  return accountId;
}

function cleanText(value: unknown, maxLen = 500): string {
  return String(value ?? "").trim().slice(0, maxLen);
}

function toNullableIsoDate(value: unknown): string | null {
  const iso = normalizeIsoDate(value);
  return iso || null;
}

function cleanTaskInput(task: any): TaskRecord | null {
  if (!task || typeof task !== "object") return null;

  const id = normalizeTaskId(task.id || task.taskId);
  if (!id) return null;

  const title = cleanText(task.title, 240) || "Untitled Task";

  return {
    id,
    title,
    description: cleanText(task.description, 2000) || undefined,
    status: cleanText(task.status, 80) || undefined,
    startDate: toNullableIsoDate(task.startDate),
    endDate: toNullableIsoDate(task.endDate),
    assignedTo: cleanText(task.assignedTo, 240) || undefined,
  };
}

function mapItemToTask(item: any): TaskRecord {
  return {
    id: String(item.taskId || item.id || ""),
    title: String(item.title || "Untitled Task"),
    description: item.description ? String(item.description) : undefined,
    status: item.status ? String(item.status) : undefined,
    startDate: item.startDate || null,
    endDate: item.endDate || null,
    assignedTo: item.assignedTo ? String(item.assignedTo) : undefined,
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
      .filter((item: any) => !item?.accountId || item.accountId === cleanAccountId)
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
        [KEY.sk]: task.id,
        accountId: cleanAccountId,
        id: task.id,
        taskId: task.id,
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
    const cleanTaskId = normalizeTaskId(taskId);

    if (!cleanTaskId) return null;

    const key = {
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: cleanTaskId,
    };

    const existing = await DynamoLib.getItem(TABLE, key);
    if (!existing || (existing.accountId && existing.accountId !== cleanAccountId)) {
      return null;
    }

    const expressionNames: Record<string, string> = {
      "#updatedAt": "updatedAt",
    };
    const expressionValues: Record<string, unknown> = {
      ":updatedAt": new Date().toISOString(),
    };
    const setParts: string[] = ["#updatedAt = :updatedAt"];

    if (payload?.title != null) {
      expressionNames["#title"] = "title";
      expressionValues[":title"] = cleanText(payload.title, 240) || "Untitled Task";
      setParts.push("#title = :title");
    }

    if (payload?.description !== undefined) {
      expressionNames["#description"] = "description";
      expressionValues[":description"] = cleanText(payload.description, 2000);
      setParts.push("#description = :description");
    }

    if (payload?.status !== undefined) {
      expressionNames["#status"] = "status";
      expressionValues[":status"] = cleanText(payload.status, 80);
      setParts.push("#status = :status");
    }

    if (payload?.assignedTo !== undefined) {
      expressionNames["#assignedTo"] = "assignedTo";
      expressionValues[":assignedTo"] = cleanText(payload.assignedTo, 240);
      setParts.push("#assignedTo = :assignedTo");
    }

    if (payload?.startDate !== undefined) {
      expressionNames["#startDate"] = "startDate";
      expressionValues[":startDate"] = toNullableIsoDate(payload.startDate);
      setParts.push("#startDate = :startDate");
    }

    if (payload?.endDate !== undefined) {
      expressionNames["#endDate"] = "endDate";
      expressionValues[":endDate"] = toNullableIsoDate(payload.endDate);
      setParts.push("#endDate = :endDate");
    }

    await DynamoLib.updateItem({
      tableName: TABLE,
      key,
      updateExpression: `SET ${setParts.join(", ")}`,
      expressionAttributeNames: expressionNames,
      expressionAttributeValues: expressionValues,
      conditionExpression: "attribute_exists(projectId) AND attribute_exists(taskId)",
    });

    const updated = await DynamoLib.getItem(TABLE, key);
    if (!updated) return null;

    return mapItemToTask(updated);
  },

  async deleteTask(accountId: string, projectId: string, taskId: string): Promise<boolean> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const cleanTaskId = normalizeTaskId(taskId);
    if (!cleanTaskId) return false;

    const key = {
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: cleanTaskId,
    };

    const existing = await DynamoLib.getItem(TABLE, key);
    if (!existing || (existing.accountId && existing.accountId !== cleanAccountId)) {
      return false;
    }

    await DynamoLib.deleteItem(TABLE, key);
    return true;
  },
};

