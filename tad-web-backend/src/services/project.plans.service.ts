import config from "../config";
import { DynamoLib } from "../libs/db/dynamo.lib";

const TABLE = config.aws.dynamo.tableName.management;
const KEY = {
  pk: "projectId",
  sk: "service",
};

const PLANS_ENTITY = "plans";

const ALLOWED_PATCH_FIELDS = new Set([
  "Id",
  "SheetName",
  "SheetNumber",
  "Discipline",
  "Revision",
  "LastModifiedDate",
  "InFolder",
  "InARevisionProcess",
  "RevisionStatus",
]);

export interface ProjectPlanRecord {
  _key: string;
  Id: string;
  SheetName: string;
  SheetNumber: string;
  Discipline: string;
  Revision: string;
  LastModifiedDate: string;
  InFolder: boolean;
  InARevisionProcess: string;
  RevisionStatus: string;
}

function normalizeProjectId(projectId: string): string {
  return String(projectId || "").startsWith("b.")
    ? String(projectId).substring(2)
    : String(projectId || "");
}

function normalizeAccountId(accountId: string): string {
  return String(accountId || "").startsWith("b.")
    ? String(accountId).substring(2)
    : String(accountId || "");
}

function cleanText(value: unknown, maxLen = 300): string {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return "";
  return cleaned.slice(0, maxLen);
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  return text === "true" || text === "1" || text === "yes" || text === "y";
}

function normalizeDate(value: unknown): string {
  const raw = cleanText(value, 80);
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
}

function buildPlanSortKey(sheetNumber: string): string {
  return `PLANS#${sheetNumber}`;
}

function mapItemToPlan(item: any): ProjectPlanRecord {
  const sheetNumber = cleanText(item?.sheetNumber || item?.SheetNumber, 120);

  return {
    _key: sheetNumber,
    Id: cleanText(item?.planId || item?.Id || sheetNumber, 120),
    SheetName: cleanText(item?.sheetName || item?.SheetName, 240),
    SheetNumber: sheetNumber,
    Discipline: cleanText(item?.discipline || item?.Discipline, 120),
    Revision: cleanText(item?.revision || item?.Revision, 120),
    LastModifiedDate: normalizeDate(item?.lastModifiedDate || item?.LastModifiedDate),
    InFolder: toBoolean(item?.inFolder ?? item?.InFolder),
    InARevisionProcess: cleanText(item?.revisionProcess || item?.InARevisionProcess, 120),
    RevisionStatus: cleanText(item?.revisionStatus || item?.RevisionStatus, 120),
  };
}

function normalizePlanInput(raw: any): ProjectPlanRecord | null {
  const sheetNumber = cleanText(raw?.SheetNumber, 120);
  if (!sheetNumber) return null;

  return {
    _key: sheetNumber,
    Id: cleanText(raw?.Id || sheetNumber, 120),
    SheetName: cleanText(raw?.SheetName, 240),
    SheetNumber: sheetNumber,
    Discipline: cleanText(raw?.Discipline || "Unassigned", 120),
    Revision: cleanText(raw?.Revision, 120),
    LastModifiedDate: normalizeDate(raw?.LastModifiedDate),
    InFolder: toBoolean(raw?.InFolder),
    InARevisionProcess: cleanText(raw?.InARevisionProcess, 120),
    RevisionStatus: cleanText(raw?.RevisionStatus, 120),
  };
}

export const ProjectPlansService = {
  async upsertPlans(accountId: string, projectId: string, rows: any[]): Promise<ProjectPlanRecord[]> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);

    const normalizedRows = (rows || [])
      .map(normalizePlanInput)
      .filter((row): row is ProjectPlanRecord => Boolean(row));

    const dedupedBySheet = new Map<string, ProjectPlanRecord>();
    normalizedRows.forEach((row) => {
      dedupedBySheet.set(row.SheetNumber, row);
    });

    const rowsToPersist = Array.from(dedupedBySheet.values());
    if (!rowsToPersist.length) return [];

    const now = new Date().toISOString();

    const items = rowsToPersist.map((row) => ({
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: buildPlanSortKey(row.SheetNumber),
      entityType: PLANS_ENTITY,
      accountId: cleanAccountId,
      planId: row.Id,
      sheetName: row.SheetName,
      sheetNumber: row.SheetNumber,
      discipline: row.Discipline,
      revision: row.Revision,
      lastModifiedDate: row.LastModifiedDate,
      inFolder: row.InFolder,
      revisionProcess: row.InARevisionProcess,
      revisionStatus: row.RevisionStatus,
      updatedAt: now,
      createdAt: now,
    }));

    await DynamoLib.batchWriteWithRetry(TABLE, items);
    return rowsToPersist;
  },

  async getPlans(accountId: string, projectId: string, discipline?: string): Promise<ProjectPlanRecord[]> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const normalizedDiscipline = cleanText(discipline || "", 120).toLowerCase();

    const allItems = await DynamoLib.queryByPK({
      tableName: TABLE,
      pkName: KEY.pk,
      pkValue: cleanProjectId,
    });

    return (allItems || [])
      .filter((item: any) => item?.entityType === PLANS_ENTITY && item?.accountId === cleanAccountId)
      .map(mapItemToPlan)
      .filter((item) => {
        if (!normalizedDiscipline || normalizedDiscipline === "all disciplines") return true;
        return item.Discipline.toLowerCase() === normalizedDiscipline;
      })
      .sort((a, b) => a.SheetNumber.localeCompare(b.SheetNumber));
  },

  async patchPlanField(
    accountId: string,
    projectId: string,
    id: string,
    field: string,
    value: unknown
  ): Promise<boolean> {
    if (!ALLOWED_PATCH_FIELDS.has(field)) {
      throw new Error(`Field not allowed: ${field}`);
    }

    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const cleanId = cleanText(id, 120);

    if (!cleanId) return false;

    const key = {
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: buildPlanSortKey(cleanId),
    };

    let item = await DynamoLib.getItem(TABLE, key);

    if (!item || item.entityType !== PLANS_ENTITY || item.accountId !== cleanAccountId) {
      const all = await ProjectPlansService.getPlans(accountId, projectId);
      const fallback = all.find((plan) => plan._key === cleanId || plan.Id === cleanId);
      if (!fallback) return false;

      item = await DynamoLib.getItem(TABLE, {
        [KEY.pk]: cleanProjectId,
        [KEY.sk]: buildPlanSortKey(fallback._key),
      });

      if (!item) return false;
    }

    const mappedField =
      field === "Id"
        ? "planId"
        : field === "SheetName"
          ? "sheetName"
          : field === "SheetNumber"
            ? "sheetNumber"
            : field === "Discipline"
              ? "discipline"
              : field === "Revision"
                ? "revision"
                : field === "LastModifiedDate"
                  ? "lastModifiedDate"
                  : field === "InFolder"
                    ? "inFolder"
                    : field === "InARevisionProcess"
                      ? "revisionProcess"
                      : field === "RevisionStatus"
                        ? "revisionStatus"
                        : field;

    const nextItem: any = {
      ...item,
      [mappedField]:
        mappedField === "inFolder"
          ? toBoolean(value)
          : mappedField === "lastModifiedDate"
            ? normalizeDate(value)
            : cleanText(value, 240),
      updatedAt: new Date().toISOString(),
    };

    if (mappedField === "sheetNumber" && nextItem.sheetNumber) {
      const oldSortKey = item[KEY.sk];
      const newSortKey = buildPlanSortKey(cleanText(nextItem.sheetNumber, 120));
      nextItem[KEY.sk] = newSortKey;

      await DynamoLib.saveItem(TABLE, nextItem);
      if (oldSortKey !== newSortKey) {
        await DynamoLib.deleteItem(TABLE, {
          [KEY.pk]: cleanProjectId,
          [KEY.sk]: oldSortKey,
        });
      }
      return true;
    }

    await DynamoLib.saveItem(TABLE, nextItem);
    return true;
  },

  async deletePlans(accountId: string, projectId: string, ids: string[]): Promise<number> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const cleanIds = Array.from(
      new Set((ids || []).map((id) => cleanText(id, 120)).filter(Boolean))
    );

    if (!cleanIds.length) return 0;

    const existingPlans = await ProjectPlansService.getPlans(accountId, projectId);
    const existingByKey = new Map(existingPlans.map((plan) => [plan._key, plan]));
    const existingById = new Map(existingPlans.map((plan) => [plan.Id, plan]));

    let deleted = 0;

    for (const id of cleanIds) {
      const plan = existingByKey.get(id) || existingById.get(id);
      if (!plan) continue;

      const key = {
        [KEY.pk]: cleanProjectId,
        [KEY.sk]: buildPlanSortKey(plan._key),
      };

      const item = await DynamoLib.getItem(TABLE, key);
      if (!item || item.entityType !== PLANS_ENTITY || item.accountId !== cleanAccountId) {
        continue;
      }

      await DynamoLib.deleteItem(TABLE, key);
      deleted += 1;
    }

    return deleted;
  },
};
