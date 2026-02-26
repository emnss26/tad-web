import config from "../config";
import { DynamoLib } from "../libs/db/dynamo.lib";
import { buildModelKey, normalizeDiscipline, normalizeProjectId } from "../utils/db/dynamo.keys";

const TABLE = config.aws.dynamo.tableName.modelChecker;
const KEY = {
  pk: "modelKey",
  sk: "discipline",
};
type LodFlag = "Y" | "N" | "NA" | null;

export interface LodCheckerRecord {
  discipline: string;
  row: number;
  concept: string;
  req_lod: string;
  complet_geometry: LodFlag;
  lod_compliance: LodFlag;
  comments: string;
}

interface ConceptEntry {
  reqLod: string | number;
  geometryComplete: LodFlag;
  lodCompliance: LodFlag;
  comment: string;
  row?: number;
}

function normalizeAccountId(accountId: string): string {
  return accountId.startsWith("b.") ? accountId.substring(2) : accountId;
}

function cleanText(value: unknown, maxLen = 500): string {
  return String(value ?? "").trim().slice(0, maxLen);
}

function normalizeConceptName(value: unknown): string {
  return cleanText(value, 200);
}

function normalizeReqLod(value: unknown): string | number {
  const raw = cleanText(value, 50);
  if (!raw) return "";

  const asNumber = Number(raw);
  return Number.isFinite(asNumber) ? asNumber : raw;
}

function normalizeStatusFlag(value: unknown): LodFlag {
  if (value === null || value === undefined) return null;

  if (typeof value === "boolean") {
    return value ? "Y" : "N";
  }

  const raw = cleanText(value, 10).toUpperCase();
  if (!raw) return null;
  if (raw === "Y" || raw === "YES" || raw === "TRUE" || raw === "1") return "Y";
  if (raw === "N" || raw === "NO" || raw === "FALSE" || raw === "0") return "N";
  if (raw === "NA" || raw === "N/A") return "NA";
  return null;
}

function cleanPayload(payload: any): LodCheckerRecord | null {
  if (!payload) return null;

  const discipline = normalizeDiscipline(payload.discipline);
  const concept = normalizeConceptName(payload.concept);
  const row = Number(payload.row);

  if (!discipline || !concept || Number.isNaN(row) || row <= 0) return null;

  return {
    discipline,
    row,
    concept,
    req_lod: String(payload.req_lod ?? payload.reqLod ?? ""),
    complet_geometry: normalizeStatusFlag(payload.complet_geometry ?? payload.geometryComplete),
    lod_compliance: normalizeStatusFlag(payload.lod_compliance ?? payload.lodCompliance),
    comments: cleanText(payload.comments ?? payload.comment, 2000),
  };
}

function conceptEntryToRecord(
  discipline: string,
  concept: string,
  entry: ConceptEntry,
  fallbackRow: number
): LodCheckerRecord {
  return {
    discipline,
    row: typeof entry.row === "number" && entry.row > 0 ? entry.row : fallbackRow,
    concept,
    req_lod: String(entry.reqLod ?? ""),
    complet_geometry: normalizeStatusFlag(entry.geometryComplete),
    lod_compliance: normalizeStatusFlag(entry.lodCompliance),
    comments: cleanText(entry.comment, 2000),
  };
}

function toConceptEntry(record: LodCheckerRecord): ConceptEntry {
  return {
    reqLod: normalizeReqLod(record.req_lod),
    geometryComplete: normalizeStatusFlag(record.complet_geometry),
    lodCompliance: normalizeStatusFlag(record.lod_compliance),
    comment: cleanText(record.comments, 2000),
    row: record.row,
  };
}

function computeMetric(rows: LodCheckerRecord[], field: "complet_geometry" | "lod_compliance") {
  const considered = rows.filter((row) => row[field] === "Y" || row[field] === "N");
  const yes = considered.filter((row) => row[field] === "Y").length;
  const total = considered.length;
  const percentage = total > 0 ? Math.round((yes / total) * 100) : 0;

  return { yes, total, percentage };
}

export const ModelCheckerService = {
  async upsertEntry(
    accountId: string,
    projectId: string,
    modelId: string,
    payload: any
  ): Promise<LodCheckerRecord | null> {
    const row = cleanPayload(payload);
    if (!row) return null;

    const cleanAccountId = normalizeAccountId(accountId);
    const modelKey = buildModelKey(normalizeProjectId(projectId), modelId);
    const discipline = normalizeDiscipline(row.discipline);

    const key = {
      [KEY.pk]: modelKey,
      [KEY.sk]: discipline,
    };

    const existing = await DynamoLib.getItem(TABLE, key);
    if (existing?.accountId && existing.accountId !== cleanAccountId) {
      return null;
    }

    const concepts: Record<string, ConceptEntry> =
      existing?.concepts && typeof existing.concepts === "object"
        ? { ...existing.concepts }
        : {};

    // Overwrite current concept state, no history.
    concepts[row.concept] = toConceptEntry(row);

    const item = {
      [KEY.pk]: modelKey,
      [KEY.sk]: discipline,
      accountId: cleanAccountId,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      concepts,
    };

    await DynamoLib.saveItem(TABLE, item);
    return row;
  },

  async replaceDisciplineEntries(
    accountId: string,
    projectId: string,
    modelId: string,
    payloads: any[]
  ): Promise<LodCheckerRecord[] | null> {
    const rows = (Array.isArray(payloads) ? payloads : [])
      .map((payload) => cleanPayload(payload))
      .filter((row): row is LodCheckerRecord => Boolean(row));

    if (!rows.length) return null;

    const firstDiscipline = normalizeDiscipline(rows[0].discipline);
    const sameDiscipline = rows.every((row) => normalizeDiscipline(row.discipline) === firstDiscipline);
    if (!sameDiscipline) return null;

    const cleanAccountId = normalizeAccountId(accountId);
    const modelKey = buildModelKey(normalizeProjectId(projectId), modelId);
    const key = {
      [KEY.pk]: modelKey,
      [KEY.sk]: firstDiscipline,
    };

    const existing = await DynamoLib.getItem(TABLE, key);
    if (existing?.accountId && existing.accountId !== cleanAccountId) {
      return null;
    }

    const concepts: Record<string, ConceptEntry> = {};
    rows.forEach((row) => {
      concepts[row.concept] = toConceptEntry(row);
    });

    const item = {
      [KEY.pk]: modelKey,
      [KEY.sk]: firstDiscipline,
      accountId: cleanAccountId,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      concepts,
    };

    await DynamoLib.saveItem(TABLE, item);

    return rows.sort((a, b) => a.row - b.row || a.concept.localeCompare(b.concept));
  },

  async getByDiscipline(
    accountId: string,
    projectId: string,
    modelId: string,
    discipline: string
  ): Promise<LodCheckerRecord[]> {
    const cleanAccountId = normalizeAccountId(accountId);
    const modelKey = buildModelKey(normalizeProjectId(projectId), modelId);
    const normalizedDiscipline = normalizeDiscipline(discipline);

    const item = await DynamoLib.getItem(TABLE, {
      [KEY.pk]: modelKey,
      [KEY.sk]: normalizedDiscipline,
    });

    if (!item || (item.accountId && item.accountId !== cleanAccountId)) return [];

    const concepts: Record<string, ConceptEntry> =
      item.concepts && typeof item.concepts === "object"
        ? item.concepts
        : {};

    return Object.entries(concepts)
      .map(([concept, entry], index) =>
        conceptEntryToRecord(normalizedDiscipline, concept, entry, index + 1)
      )
      .sort((a, b) => a.row - b.row || a.concept.localeCompare(b.concept));
  },

  async getAll(accountId: string, projectId: string, modelId: string): Promise<LodCheckerRecord[]> {
    const cleanAccountId = normalizeAccountId(accountId);
    const modelKey = buildModelKey(normalizeProjectId(projectId), modelId);

    const items = await DynamoLib.queryByPK({
      tableName: TABLE,
      pkName: KEY.pk,
      pkValue: modelKey,
    });

    const rows: LodCheckerRecord[] = [];

    (items || [])
      .filter((item: any) => !item?.accountId || item.accountId === cleanAccountId)
      .forEach((item: any) => {
        const discipline = normalizeDiscipline(item.discipline);
        const concepts: Record<string, ConceptEntry> =
          item?.concepts && typeof item.concepts === "object"
            ? item.concepts
            : {};

        Object.entries(concepts).forEach(([concept, entry], index) => {
          rows.push(conceptEntryToRecord(discipline, concept, entry, index + 1));
        });
      });

    return rows.sort(
      (a, b) => a.discipline.localeCompare(b.discipline) || a.row - b.row || a.concept.localeCompare(b.concept)
    );
  },

  async getProjectCompliance(accountId: string, projectId: string, modelId: string) {
    const allRows = await this.getAll(accountId, projectId, modelId);
    const byDiscipline = new Map<string, LodCheckerRecord[]>();

    allRows.forEach((row) => {
      const key = normalizeDiscipline(row.discipline);
      if (!byDiscipline.has(key)) byDiscipline.set(key, []);
      byDiscipline.get(key)!.push(row);
    });

    const disciplineSummaries = Array.from(byDiscipline.entries())
      .map(([discipline, rows]) => {
        const geometry = computeMetric(rows, "complet_geometry");
        const lod = computeMetric(rows, "lod_compliance");
        const overall = Math.round((geometry.percentage + lod.percentage) / 2);

        return {
          discipline,
          rows: rows.length,
          geometry,
          lod,
          overall,
        };
      })
      .sort((a, b) => a.discipline.localeCompare(b.discipline));

    const totalGeometry = computeMetric(allRows, "complet_geometry");
    const totalLod = computeMetric(allRows, "lod_compliance");

    return {
      totals: {
        geometry: totalGeometry,
        lod: totalLod,
        overall: Math.round((totalGeometry.percentage + totalLod.percentage) / 2),
      },
      disciplines: disciplineSummaries,
    };
  },

  async deleteByDiscipline(
    accountId: string,
    projectId: string,
    modelId: string,
    discipline: string
  ): Promise<number> {
    const cleanAccountId = normalizeAccountId(accountId);
    const modelKey = buildModelKey(normalizeProjectId(projectId), modelId);
    const normalizedDiscipline = normalizeDiscipline(discipline);

    const key = {
      [KEY.pk]: modelKey,
      [KEY.sk]: normalizedDiscipline,
    };

    const item = await DynamoLib.getItem(TABLE, key);
    if (!item || (item.accountId && item.accountId !== cleanAccountId)) return 0;

    await DynamoLib.deleteItem(TABLE, key);
    return 1;
  },
};

