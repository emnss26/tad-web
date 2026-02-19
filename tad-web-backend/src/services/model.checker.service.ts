import config from "../config";
import { DynamoLib } from "../libs/db/dynamo.lib";

const TABLE = config.aws.dynamo.tableName.management;
const KEY = {
  pk: "projectId",
  sk: "service",
};

const LOD_ENTITY = "lod-checker";

export interface LodCheckerRecord {
  discipline: string;
  row: number;
  concept: string;
  req_lod: string;
  complet_geometry: string;
  lod_compliance: string;
  comments: string;
}

function normalizeProjectId(projectId: string): string {
  if (projectId.startsWith("b.")) return projectId.substring(2);
  return projectId;
}

function normalizeAccountId(accountId: string): string {
  if (accountId.startsWith("b.")) return accountId.substring(2);
  return accountId;
}

function normalizeDiscipline(discipline: string): string {
  return String(discipline || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function normalizeFlag(value: unknown): string {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "Y" || normalized === "N" || normalized === "NA") {
    return normalized;
  }
  return "N";
}

function buildLodSortKey(discipline: string, row: number): string {
  return `LOD#${normalizeDiscipline(discipline)}#ROW#${row}`;
}

function mapItemToRecord(item: any): LodCheckerRecord {
  return {
    discipline: item.discipline,
    row: Number(item.row || 0),
    concept: String(item.concept || ""),
    req_lod: String(item.req_lod || ""),
    complet_geometry: normalizeFlag(item.complet_geometry),
    lod_compliance: normalizeFlag(item.lod_compliance),
    comments: String(item.comments || ""),
  };
}

function cleanPayload(payload: any): LodCheckerRecord | null {
  if (!payload) return null;

  const discipline = String(payload.discipline || "").trim();
  const concept = String(payload.concept || "").trim();
  const row = Number(payload.row);

  if (!discipline || !concept || Number.isNaN(row) || row <= 0) {
    return null;
  }

  return {
    discipline,
    row,
    concept,
    req_lod: String(payload.req_lod || ""),
    complet_geometry: normalizeFlag(payload.complet_geometry),
    lod_compliance: normalizeFlag(payload.lod_compliance),
    comments: String(payload.comments || ""),
  };
}

export const ModelCheckerService = {
  async upsertEntry(accountId: string, projectId: string, payload: any): Promise<LodCheckerRecord | null> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const row = cleanPayload(payload);

    if (!row) return null;

    const item = {
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: buildLodSortKey(row.discipline, row.row),
      entityType: LOD_ENTITY,
      accountId: cleanAccountId,
      disciplineKey: normalizeDiscipline(row.discipline),
      discipline: row.discipline,
      row: row.row,
      concept: row.concept,
      req_lod: row.req_lod,
      complet_geometry: row.complet_geometry,
      lod_compliance: row.lod_compliance,
      comments: row.comments,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const existing = await DynamoLib.getItem(TABLE, {
      [KEY.pk]: cleanProjectId,
      [KEY.sk]: buildLodSortKey(row.discipline, row.row),
    });

    if (existing) {
      item.createdAt = existing.createdAt || item.createdAt;
    }

    await DynamoLib.saveItem(TABLE, item);
    return mapItemToRecord(item);
  },

  async getByDiscipline(accountId: string, projectId: string, discipline: string): Promise<LodCheckerRecord[]> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const disciplineKey = normalizeDiscipline(discipline);

    const all = await DynamoLib.queryByPK({
      tableName: TABLE,
      pkName: KEY.pk,
      pkValue: cleanProjectId,
    });

    return (all || [])
      .filter((item: any) =>
        item?.entityType === LOD_ENTITY
        && item?.accountId === cleanAccountId
        && item?.disciplineKey === disciplineKey
      )
      .map(mapItemToRecord)
      .sort((a, b) => a.row - b.row);
  },

  async getAll(accountId: string, projectId: string): Promise<LodCheckerRecord[]> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);

    const all = await DynamoLib.queryByPK({
      tableName: TABLE,
      pkName: KEY.pk,
      pkValue: cleanProjectId,
    });

    return (all || [])
      .filter((item: any) => item?.entityType === LOD_ENTITY && item?.accountId === cleanAccountId)
      .map(mapItemToRecord)
      .sort((a, b) => a.discipline.localeCompare(b.discipline) || a.row - b.row);
  },

  async deleteByDiscipline(accountId: string, projectId: string, discipline: string): Promise<number> {
    const cleanProjectId = normalizeProjectId(projectId);
    const cleanAccountId = normalizeAccountId(accountId);
    const disciplineKey = normalizeDiscipline(discipline);

    const all = await DynamoLib.queryByPK({
      tableName: TABLE,
      pkName: KEY.pk,
      pkValue: cleanProjectId,
    });

    const targets = (all || []).filter((item: any) =>
      item?.entityType === LOD_ENTITY
      && item?.accountId === cleanAccountId
      && item?.disciplineKey === disciplineKey
    );

    await Promise.all(
      targets.map((item: any) =>
        DynamoLib.deleteItem(TABLE, {
          [KEY.pk]: cleanProjectId,
          [KEY.sk]: item.service,
        })
      )
    );

    return targets.length;
  },
};