import config from "../config";
import { DynamoLib } from "../libs/db/dynamo.lib";
import {
  buildSheetKey,
  computePlanStatus,
  normalizeDiscipline,
  normalizeIsoDate,
  normalizeProjectId,
  normalizeSheetNumber,
} from "../utils/db/dynamo.keys";

const TABLE = config.aws.dynamo.tableName.plans;
const KEY = {
  pk: "projectId",
  sk: "sheetKey",
};

const ALLOWED_PATCH_FIELDS = new Set([
  "discipline",
  "sheetNumber",
  "revision",
  "plannedGenerationDate",
  "plannedIssueDate",
  "actualGenerationDate",
  "actualIssueDate",
  "status",
  "sheetName",
  "Discipline",
  "SheetNumber",
  "Revision",
  "PlannedGenerationDate",
  "PlannedIssueDate",
  "ActualGenerationDate",
  "ActualIssueDate",
  "SheetName",
]);

export interface ProjectPlanRecord {
  _key: string;
  discipline: string;
  sheetNumber: string;
  revision: string;
  plannedGenerationDate: string;
  plannedIssueDate: string;
  actualGenerationDate: string;
  actualIssueDate: string;
  status: "PLANNED" | "GENERATED" | "ISSUED";
  updatedAt: string;
  sheetName?: string;
}

function normalizeAccountId(accountId: string): string {
  return accountId.startsWith("b.") ? accountId.substring(2) : accountId;
}

function cleanText(value: unknown, maxLen = 300): string {
  return String(value ?? "").trim().slice(0, maxLen);
}

function fromAnyDate(value: unknown): string {
  return normalizeIsoDate(value);
}

function normalizeInput(raw: any): ProjectPlanRecord | null {
  const discipline = normalizeDiscipline(raw?.discipline || raw?.Discipline);
  const sheetNumber = normalizeSheetNumber(raw?.sheetNumber || raw?.SheetNumber);

  if (!discipline || !sheetNumber) return null;

  const plannedGenerationDate = fromAnyDate(
    raw?.plannedGenerationDate ?? raw?.PlannedGenerationDate ?? raw?.LastModifiedDate
  );
  const plannedIssueDate = fromAnyDate(raw?.plannedIssueDate ?? raw?.PlannedIssueDate);
  const actualGenerationDate = fromAnyDate(raw?.actualGenerationDate ?? raw?.ActualGenerationDate);
  const actualIssueDate = fromAnyDate(raw?.actualIssueDate ?? raw?.ActualIssueDate);

  return {
    _key: buildSheetKey(discipline, sheetNumber),
    discipline,
    sheetNumber,
    revision: cleanText(raw?.revision ?? raw?.Revision, 80),
    plannedGenerationDate,
    plannedIssueDate,
    actualGenerationDate,
    actualIssueDate,
    status: computePlanStatus(actualGenerationDate, actualIssueDate),
    updatedAt: new Date().toISOString(),
    sheetName: cleanText(raw?.sheetName ?? raw?.SheetName, 240) || undefined,
  };
}

function mapItemToPlan(item: any): ProjectPlanRecord & Record<string, any> {
  const discipline = normalizeDiscipline(item?.discipline || item?.Discipline);
  const sheetNumber = normalizeSheetNumber(item?.sheetNumber || item?.SheetNumber);
  const plannedGenerationDate = fromAnyDate(item?.plannedGenerationDate || item?.PlannedGenerationDate);
  const plannedIssueDate = fromAnyDate(item?.plannedIssueDate || item?.PlannedIssueDate);
  const actualGenerationDate = fromAnyDate(item?.actualGenerationDate || item?.ActualGenerationDate);
  const actualIssueDate = fromAnyDate(item?.actualIssueDate || item?.ActualIssueDate);
  const status = computePlanStatus(actualGenerationDate, actualIssueDate);
  const updatedAt = fromAnyDate(item?.updatedAt) || new Date().toISOString();

  return {
    _key: item?.sheetKey || buildSheetKey(discipline, sheetNumber),
    discipline,
    sheetNumber,
    revision: cleanText(item?.revision || item?.Revision, 80),
    plannedGenerationDate,
    plannedIssueDate,
    actualGenerationDate,
    actualIssueDate,
    status,
    updatedAt,
    sheetName: cleanText(item?.sheetName || item?.SheetName, 240) || undefined,
    // Backward-compatible fields for current frontend
    Id: item?.sheetKey || buildSheetKey(discipline, sheetNumber),
    SheetName: cleanText(item?.sheetName || item?.SheetName, 240),
    SheetNumber: sheetNumber,
    Discipline: discipline,
    Revision: cleanText(item?.revision || item?.Revision, 80),
    LastModifiedDate: updatedAt,
    InFolder: Boolean(actualGenerationDate),
    InARevisionProcess: status === "GENERATED" ? "GENERATED" : "",
    RevisionStatus: status,
  };
}

export const ProjectPlansService = {
  async upsertPlans(accountId: string, projectId: string, rows: any[]): Promise<ProjectPlanRecord[]> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const now = new Date().toISOString();

    const normalizedRows = (rows || [])
      .map(normalizeInput)
      .filter((row): row is ProjectPlanRecord => Boolean(row));

    const dedup = new Map<string, ProjectPlanRecord>();
    normalizedRows.forEach((row) => dedup.set(row._key, row));
    const rowsToPersist = Array.from(dedup.values());

    if (!rowsToPersist.length) return [];

    const items = rowsToPersist.map((row) => ({
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: row._key,
      accountId: cleanAccountId,
      discipline: row.discipline,
      sheetNumber: row.sheetNumber,
      revision: row.revision,
      plannedGenerationDate: row.plannedGenerationDate,
      plannedIssueDate: row.plannedIssueDate,
      actualGenerationDate: row.actualGenerationDate,
      actualIssueDate: row.actualIssueDate,
      status: computePlanStatus(row.actualGenerationDate, row.actualIssueDate),
      sheetName: row.sheetName || "",
      updatedAt: now,
      createdAt: now,
    }));

    await DynamoLib.batchWriteWithRetry(TABLE, items);
    return items.map(mapItemToPlan);
  },

  async getPlans(accountId: string, projectId: string, discipline?: string): Promise<ProjectPlanRecord[]> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const wantedDiscipline = normalizeDiscipline(discipline || "");

    const all = await DynamoLib.queryByPK({
      tableName: TABLE,
      pkName: KEY.pk,
      pkValue: cleanProjectId,
    });

    return (all || [])
      .filter((item: any) => !item?.accountId || item.accountId === cleanAccountId)
      .map(mapItemToPlan)
      .filter((item) => !wantedDiscipline || item.discipline === wantedDiscipline)
      .sort((a, b) => a.sheetNumber.localeCompare(b.sheetNumber));
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

    const plans = await ProjectPlansService.getPlans(accountId, projectId);
    const current = plans.find((plan: any) => plan._key === id || plan.sheetNumber === id || plan.SheetNumber === id);
    if (!current) return false;

    const patchField =
      field === "Discipline"
        ? "discipline"
        : field === "SheetNumber"
          ? "sheetNumber"
          : field === "Revision"
            ? "revision"
            : field === "PlannedGenerationDate"
              ? "plannedGenerationDate"
              : field === "PlannedIssueDate"
                ? "plannedIssueDate"
                : field === "ActualGenerationDate"
                  ? "actualGenerationDate"
                  : field === "ActualIssueDate"
                    ? "actualIssueDate"
                    : field === "SheetName"
                      ? "sheetName"
                      : field;

    const next = {
      ...current,
      [patchField]:
        patchField.includes("Date")
          ? fromAnyDate(value)
          : patchField === "discipline"
            ? normalizeDiscipline(String(value))
            : patchField === "sheetNumber"
              ? normalizeSheetNumber(String(value))
              : cleanText(value, 240),
      updatedAt: new Date().toISOString(),
    };

    next.status = computePlanStatus(next.actualGenerationDate, next.actualIssueDate);
    next._key = buildSheetKey(next.discipline, next.sheetNumber);

    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);

    const item = {
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: next._key,
      accountId: cleanAccountId,
      discipline: next.discipline,
      sheetNumber: next.sheetNumber,
      revision: next.revision,
      plannedGenerationDate: next.plannedGenerationDate,
      plannedIssueDate: next.plannedIssueDate,
      actualGenerationDate: next.actualGenerationDate,
      actualIssueDate: next.actualIssueDate,
      status: next.status,
      sheetName: next.sheetName || "",
      updatedAt: next.updatedAt,
      createdAt: (current as any).createdAt || next.updatedAt,
    };

    await DynamoLib.saveItem(TABLE, item);

    if (current._key !== next._key) {
      await DynamoLib.deleteItem(TABLE, {
        [KEY.pk]: cleanProjectId,
        [KEY.sk]: current._key,
      });
    }

    return true;
  },

  async deletePlans(accountId: string, projectId: string, ids: string[]): Promise<number> {
    const cleanProjectId = normalizeProjectId(projectId);
    const plans = await ProjectPlansService.getPlans(accountId, projectId);

    const wanted = new Set((ids || []).map((id) => cleanText(id, 260)).filter(Boolean));
    const targets = plans.filter((plan: any) =>
      wanted.has(plan._key) || wanted.has(plan.sheetNumber) || wanted.has(plan.SheetNumber)
    );

    await Promise.all(
      targets.map((plan: any) =>
        DynamoLib.deleteItem(TABLE, {
          [KEY.pk]: cleanProjectId,
          [KEY.sk]: plan._key,
        })
      )
    );

    return targets.length;
  },
};

