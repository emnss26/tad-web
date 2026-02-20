import config from "../config";
import { DynamoLib } from "../libs/db/dynamo.lib";
import { buildModelKey, normalizeDiscipline, normalizeProjectId } from "../utils/db/dynamo.keys";

const TABLE = config.aws.dynamo.tableName.modelChecker;
const KEY = {
  pk: "modelKey",
  sk: "discipline",
};

export interface LodCheckerRecord {
  discipline: string;
  row: number;
  concept: string;
  req_lod: string;
  complet_geometry: "Y" | "N";
  lod_compliance: "Y" | "N";
  comments: string;
}

interface ConceptEntry {
  reqLod: string | number;
  geometryComplete: boolean;
  lodCompliance: boolean;
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

function normalizeBooleanFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const raw = cleanText(value, 10).toUpperCase();
  if (raw === "Y" || raw === "YES" || raw === "TRUE" || raw === "1") return true;
  return false;
}

function boolToLegacy(value: boolean): "Y" | "N" {
  return value ? "Y" : "N";
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
    complet_geometry: boolToLegacy(
      normalizeBooleanFlag(payload.complet_geometry ?? payload.geometryComplete)
    ),
    lod_compliance: boolToLegacy(
      normalizeBooleanFlag(payload.lod_compliance ?? payload.lodCompliance)
    ),
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
    complet_geometry: boolToLegacy(Boolean(entry.geometryComplete)),
    lod_compliance: boolToLegacy(Boolean(entry.lodCompliance)),
    comments: cleanText(entry.comment, 2000),
  };
}

function toConceptEntry(record: LodCheckerRecord): ConceptEntry {
  return {
    reqLod: normalizeReqLod(record.req_lod),
    geometryComplete: record.complet_geometry === "Y",
    lodCompliance: record.lod_compliance === "Y",
    comment: cleanText(record.comments, 2000),
    row: record.row,
  };
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

