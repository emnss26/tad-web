import { randomUUID } from "crypto";
import config from "../config";
import { fetchAllElementsByModel, IAecElementRow } from "../libs/aec/aec.model.parameters";
import { DynamoLib } from "../libs/db/dynamo.lib";

const WBS_SETS_TABLE = config.aws.dynamo.tableName.wbsSets;
const WBS_ITEMS_TABLE = config.aws.dynamo.tableName.wbsItems;
const WBS_MATCHES_TABLE = config.aws.dynamo.tableName.wbsElementMatches;

const WBS_SETS_KEY = {
  pk: "projectId",
  sk: "setId",
};

const WBS_ITEMS_KEY = {
  pk: "wbsSetId",
  sk: "itemKey",
};

const MATCHES_KEY = {
  pk: "runId",
  sk: "itemKey",
};

const WBS_CODE_REGEX = /^\d+(\.\d+)*$/;
const DESCRIPTION_MATCH_THRESHOLD = 0.45;
const AMBIGUOUS_GAP_THRESHOLD = 0.05;

const STOPWORDS = new Set([
  "de",
  "la",
  "el",
  "los",
  "las",
  "and",
  "the",
  "for",
  "con",
  "sin",
  "por",
  "para",
]);

const toText = (value: unknown): string => String(value ?? "").trim();

const parseIsoDate = (value: unknown): string | null => {
  const raw = toText(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const parseCost = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(2));
};

const normalizeCodeLookup = (value: unknown): string => {
  const raw = toText(value).replace(/\s+/g, "");
  if (!raw) return "";
  if (WBS_CODE_REGEX.test(raw)) {
    return raw.replace(/\.+/g, ".").replace(/\.$/, "");
  }
  return raw.toUpperCase();
};

const normalizeWbsCode = (value: unknown): string => {
  const code = normalizeCodeLookup(value);
  if (!WBS_CODE_REGEX.test(code)) return "";
  return code;
};

const getWbsLevel = (code: string): number => normalizeWbsCode(code).split(".").filter(Boolean).length;

const getParentCode = (code: string): string => {
  const parts = normalizeWbsCode(code).split(".").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join(".");
};

const compareWbsCodes = (a: string, b: string): number => {
  const aParts = normalizeWbsCode(a)
    .split(".")
    .map((n) => Number(n));
  const bParts = normalizeWbsCode(b)
    .split(".")
    .map((n) => Number(n));
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i += 1) {
    const av = Number.isFinite(aParts[i]) ? aParts[i] : -1;
    const bv = Number.isFinite(bParts[i]) ? bParts[i] : -1;
    if (av !== bv) return av - bv;
  }
  return 0;
};

const normalizeText = (value: unknown): string =>
  toText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenizeText = (value: unknown): string[] =>
  normalizeText(value)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t && t.length >= 3 && !STOPWORDS.has(t));

const toTokenSet = (value: unknown): Set<string> => new Set(tokenizeText(value));

const similarityScore = (leftSet: Set<string>, rightSet: Set<string>): number => {
  if (!leftSet.size || !rightSet.size) return 0;
  let intersection = 0;
  leftSet.forEach((token) => {
    if (rightSet.has(token)) intersection += 1;
  });
  const coverage = intersection / rightSet.size;
  const union = new Set([...leftSet, ...rightSet]).size || 1;
  const jaccard = intersection / union;
  return Math.max(coverage, jaccard);
};

const sanitizeWbsRows = (rows: any[]) => {
  if (!Array.isArray(rows)) return [];

  const out: any[] = [];
  const seenCodes = new Set<string>();

  for (const row of rows) {
    const code = normalizeWbsCode(row?.code || row?.wbsCode);
    const title = toText(row?.title || row?.name || row?.activity);
    if (!code || !title) continue;

    const level = getWbsLevel(code);
    if (!level || level > 8) continue;

    if (seenCodes.has(code)) {
      throw new Error(`Duplicate WBS code detected: ${code}`);
    }
    seenCodes.add(code);

    out.push({
      code,
      title,
      level,
      parentCode: getParentCode(code),
      startDate: parseIsoDate(row?.startDate || row?.start_date),
      endDate: parseIsoDate(row?.endDate || row?.end_date),
      durationLabel: toText(row?.duration || row?.durationLabel || row?.duration_label),
      baselineStartDate: parseIsoDate(row?.baselineStartDate || row?.baseline_start_date),
      baselineEndDate: parseIsoDate(row?.baselineEndDate || row?.baseline_end_date),
      actualStartDate: parseIsoDate(row?.actualStartDate || row?.actual_start_date),
      actualEndDate: parseIsoDate(row?.actualEndDate || row?.actual_end_date),
      actualProgressPct:
        row?.actualProgressPct === undefined || row?.actualProgressPct === null
          ? null
          : Number(row.actualProgressPct),
      plannedCost: parseCost(row?.plannedCost || row?.planned_cost),
      actualCost: parseCost(row?.actualCost || row?.actual_cost),
      extraProps: row?.extraProps || row?.extra_props || null,
    });
  }

  return out.sort((a, b) => compareWbsCodes(a.code, b.code));
};

const getCreatedAt = (item: any): number => new Date(String(item?.createdAt || 0)).getTime() || 0;

const pickLatestSet = (sets: any[], modelId?: string): any | null => {
  if (!Array.isArray(sets) || sets.length === 0) return null;

  const filtered = toText(modelId)
    ? sets.filter((set) => toText(set?.modelId) === toText(modelId))
    : sets;

  if (!filtered.length) return null;
  return filtered.sort((a, b) => getCreatedAt(b) - getCreatedAt(a))[0];
};

const getWbsItemsForSet = async (wbsSetId: string) => {
  const rows = await DynamoLib.queryByPK({
    tableName: WBS_ITEMS_TABLE,
    pkName: WBS_ITEMS_KEY.pk,
    pkValue: wbsSetId,
  });

  return (rows || [])
    .sort((a, b) => compareWbsCodes(toText(a?.wbsCode), toText(b?.wbsCode)))
    .map((item) => ({
      id: toText(item?.itemKey).replace(/^WBS#/, "") || randomUUID(),
      code: toText(item?.wbsCode),
      title: toText(item?.title),
      level: Number(item?.level) || getWbsLevel(item?.wbsCode),
      parentCode: toText(item?.parentCode),
      startDate: item?.startDate || null,
      endDate: item?.endDate || null,
      duration: item?.durationLabel || "",
      baselineStartDate: item?.baselineStartDate || null,
      baselineEndDate: item?.baselineEndDate || null,
      actualStartDate: item?.actualStartDate || null,
      actualEndDate: item?.actualEndDate || null,
      actualProgressPct: item?.actualProgressPct ?? null,
      plannedCost: item?.plannedCost ?? null,
      actualCost: item?.actualCost ?? null,
      extraProps: item?.extraProps || null,
    }));
};

type MatchStrategy = "assembly-code-exact" | "assembly-code-prefix" | "description-similarity" | "unmatched";

const buildTextSourceForElement = (row: IAecElementRow): string =>
  [
    row.assemblyDescription,
    row.elementName,
    row.familyName,
    row.category,
    row.typeMark,
    row.description,
  ]
    .map((value) => toText(value))
    .filter(Boolean)
    .join(" ");

const runSingleMatch = (
  element: IAecElementRow,
  wbsRows: any[],
  wbsByCode: Map<string, any>,
  wbsTextTokens: Array<{ row: any; tokens: Set<string> }>
) => {
  const assemblyCode = normalizeWbsCode(element.assemblyCode);
  const elementTextTokens = toTokenSet(buildTextSourceForElement(element));

  if (assemblyCode) {
    const direct = wbsByCode.get(assemblyCode);
    if (direct) {
      return {
        matchedCode: direct.code,
        matchedTitle: direct.title,
        confidence: 1,
        strategy: "assembly-code-exact" as MatchStrategy,
      };
    }

    const prefix = [...wbsRows]
      .sort((a, b) => b.code.length - a.code.length)
      .find((row) => assemblyCode.startsWith(`${row.code}.`) || assemblyCode === row.code);
    if (prefix) {
      return {
        matchedCode: prefix.code,
        matchedTitle: prefix.title,
        confidence: 0.9,
        strategy: "assembly-code-prefix" as MatchStrategy,
      };
    }
  }

  let best:
    | {
        row: any;
        score: number;
      }
    | undefined;
  let secondBest = 0;

  wbsTextTokens.forEach((candidate) => {
    const score = similarityScore(elementTextTokens, candidate.tokens);
    if (!best || score > best.score) {
      secondBest = best?.score || secondBest;
      best = { row: candidate.row, score };
      return;
    }
    if (score > secondBest) secondBest = score;
  });

  if (
    best &&
    best.score >= DESCRIPTION_MATCH_THRESHOLD &&
    best.score - secondBest >= AMBIGUOUS_GAP_THRESHOLD
  ) {
    return {
      matchedCode: best.row.code,
      matchedTitle: best.row.title,
      confidence: Number(best.score.toFixed(4)),
      strategy: "description-similarity" as MatchStrategy,
    };
  }

  return {
    matchedCode: null,
    matchedTitle: null,
    confidence: 0,
    strategy: "unmatched" as MatchStrategy,
  };
};

export const AecWbsService = {
  async saveProjectWbs({
    dmProjectId,
    modelId,
    sourceName,
    rows,
  }: {
    dmProjectId: string;
    modelId?: string;
    sourceName?: string;
    rows: any[];
  }) {
    const projectId = toText(dmProjectId);
    if (!projectId) throw new Error("Project ID is required");

    const sanitizedRows = sanitizeWbsRows(rows || []);
    if (!sanitizedRows.length) {
      throw new Error("No valid WBS rows were provided");
    }

    const createdAt = new Date().toISOString();
    const setId = `WBSSET#${Date.now()}#${randomUUID()}`;

    const setItem = {
      [WBS_SETS_KEY.pk]: projectId,
      [WBS_SETS_KEY.sk]: setId,
      modelId: toText(modelId) || null,
      sourceName: toText(sourceName) || "WBS_Manual",
      rowCount: sanitizedRows.length,
      createdAt,
      updatedAt: createdAt,
      latestMatchRunId: null,
      latestMatchAt: null,
    };

    await DynamoLib.saveItem(WBS_SETS_TABLE, setItem);

    const wbsItems = sanitizedRows.map((row) => ({
      [WBS_ITEMS_KEY.pk]: setId,
      [WBS_ITEMS_KEY.sk]: `WBS#${row.code}`,
      wbsSetId: setId,
      wbsCode: row.code,
      title: row.title,
      level: row.level,
      parentCode: row.parentCode,
      startDate: row.startDate,
      endDate: row.endDate,
      durationLabel: row.durationLabel,
      baselineStartDate: row.baselineStartDate,
      baselineEndDate: row.baselineEndDate,
      actualStartDate: row.actualStartDate,
      actualEndDate: row.actualEndDate,
      actualProgressPct: row.actualProgressPct,
      plannedCost: row.plannedCost,
      actualCost: row.actualCost,
      extraProps: row.extraProps,
      createdAt,
    }));

    await DynamoLib.batchWriteWithRetry(WBS_ITEMS_TABLE, wbsItems, { chunkSize: 25, maxRetries: 5 });

    return {
      wbsSetId: setId,
      rowsSaved: sanitizedRows.length,
      modelId: toText(modelId) || null,
      sourceName: toText(sourceName) || "WBS_Manual",
    };
  },

  async getLatestProjectWbs(dmProjectId: string, modelId?: string) {
    const projectId = toText(dmProjectId);
    if (!projectId) throw new Error("Project ID is required");

    const sets = await DynamoLib.queryByPK({
      tableName: WBS_SETS_TABLE,
      pkName: WBS_SETS_KEY.pk,
      pkValue: projectId,
    });

    const latestSet = pickLatestSet(sets || [], modelId);
    if (!latestSet?.setId) {
      return {
        found: false,
      };
    }

    const rows = await getWbsItemsForSet(String(latestSet.setId));

    return {
      found: true,
      data: {
        wbsSetId: latestSet.setId,
        modelId: latestSet.modelId || null,
        sourceName: latestSet.sourceName || "",
        createdAt: latestSet.createdAt || null,
        rows,
      },
    };
  },

  async runWbsModelMatching({
    token,
    dmProjectId,
    modelId,
    wbsSetId,
  }: {
    token: string;
    dmProjectId: string;
    modelId: string;
    wbsSetId?: string;
  }) {
    const projectId = toText(dmProjectId);
    const cleanModelId = toText(modelId);
    if (!projectId) throw new Error("Project ID is required");
    if (!cleanModelId) throw new Error("modelId is required");

    let selectedSet: any | null = null;
    if (toText(wbsSetId)) {
      const sets = await DynamoLib.queryByPK({
        tableName: WBS_SETS_TABLE,
        pkName: WBS_SETS_KEY.pk,
        pkValue: projectId,
      });
      selectedSet = (sets || []).find((set) => toText(set?.setId) === toText(wbsSetId)) || null;
    } else {
      const sets = await DynamoLib.queryByPK({
        tableName: WBS_SETS_TABLE,
        pkName: WBS_SETS_KEY.pk,
        pkValue: projectId,
      });
      selectedSet = pickLatestSet(sets || [], cleanModelId);
    }

    if (!selectedSet?.setId) {
      throw new Error("No WBS set found for this project/model");
    }

    const wbsRows = await getWbsItemsForSet(String(selectedSet.setId));
    if (!wbsRows.length) {
      throw new Error("Selected WBS set has no rows");
    }

    const elements = await fetchAllElementsByModel(token, cleanModelId);

    const wbsByCode = new Map<string, any>();
    const wbsTextTokens = wbsRows.map((row) => {
      wbsByCode.set(toText(row.code), row);
      return {
        row,
        tokens: toTokenSet(`${row.code} ${row.title}`),
      };
    });

    const matchedRows = elements.map((element, index) => {
      const match = runSingleMatch(element, wbsRows, wbsByCode, wbsTextTokens);
      return {
        itemKey: `EL#${String(index + 1).padStart(6, "0")}`,
        viewerDbId: element.viewerDbId ?? null,
        dbId: element.dbId ?? null,
        elementId: element.elementId || "",
        revitElementId: element.revitElementId || "",
        externalElementId: element.externalElementId || "",
        category: element.category || "",
        familyName: element.familyName || "",
        elementName: element.elementName || "",
        typeMark: element.typeMark || "",
        description: element.description || "",
        assemblyCode: element.assemblyCode || "",
        assemblyDescription: element.assemblyDescription || "",
        matchedWbsCode: match.matchedCode,
        matchedWbsTitle: match.matchedTitle,
        confidence: match.confidence,
        strategy: match.strategy,
      };
    });

    const createdAt = new Date().toISOString();
    const runId = `MATCHRUN#${Date.now()}#${randomUUID()}`;
    const totalElements = matchedRows.length;
    const matchedElements = matchedRows.filter((row) => toText(row.matchedWbsCode) !== "").length;
    const unmatchedElements = totalElements - matchedElements;
    const avgConfidence =
      matchedElements > 0
        ? Number(
            (
              matchedRows
                .filter((row) => toText(row.matchedWbsCode) !== "")
                .reduce((acc, row) => acc + Number(row.confidence || 0), 0) / matchedElements
            ).toFixed(4)
          )
        : 0;

    const metaItem = {
      [MATCHES_KEY.pk]: runId,
      [MATCHES_KEY.sk]: "META",
      runId,
      dmProjectId: projectId,
      modelId: cleanModelId,
      wbsSetId: selectedSet.setId,
      totalElements,
      matchedElements,
      unmatchedElements,
      averageConfidence: avgConfidence,
      createdAt,
    };

    await DynamoLib.saveItem(WBS_MATCHES_TABLE, metaItem);

    const rowItems = matchedRows.map((row) => ({
      [MATCHES_KEY.pk]: runId,
      [MATCHES_KEY.sk]: row.itemKey,
      runId,
      ...row,
      createdAt,
    }));

    if (rowItems.length) {
      await DynamoLib.batchWriteWithRetry(WBS_MATCHES_TABLE, rowItems, { chunkSize: 25, maxRetries: 5 });
    }

    await DynamoLib.updateItem({
      tableName: WBS_SETS_TABLE,
      key: {
        [WBS_SETS_KEY.pk]: projectId,
        [WBS_SETS_KEY.sk]: selectedSet.setId,
      },
      updateExpression:
        "SET #latestRun = :latestRun, #latestAt = :latestAt, #matched = :matched, #total = :total, #updatedAt = :updatedAt",
      expressionAttributeNames: {
        "#latestRun": "latestMatchRunId",
        "#latestAt": "latestMatchAt",
        "#matched": "lastMatchedElements",
        "#total": "lastTotalElements",
        "#updatedAt": "updatedAt",
      },
      expressionAttributeValues: {
        ":latestRun": runId,
        ":latestAt": createdAt,
        ":matched": matchedElements,
        ":total": totalElements,
        ":updatedAt": createdAt,
      },
    });

    return {
      runId,
      wbsSetId: selectedSet.setId,
      totalElements,
      matchedElements,
      unmatchedElements,
      averageConfidence: avgConfidence,
    };
  },

  async getLatestWbsModelMatching(dmProjectId: string, modelId: string) {
    const projectId = toText(dmProjectId);
    const cleanModelId = toText(modelId);
    if (!projectId) throw new Error("Project ID is required");
    if (!cleanModelId) throw new Error("modelId is required");

    const sets = await DynamoLib.queryByPK({
      tableName: WBS_SETS_TABLE,
      pkName: WBS_SETS_KEY.pk,
      pkValue: projectId,
    });

    const latestSet = pickLatestSet(sets || [], cleanModelId);
    if (!latestSet?.latestMatchRunId) {
      return { found: false };
    }

    const runId = toText(latestSet.latestMatchRunId);
    const items = await DynamoLib.queryByPK({
      tableName: WBS_MATCHES_TABLE,
      pkName: MATCHES_KEY.pk,
      pkValue: runId,
    });

    const meta = (items || []).find((item) => toText(item?.itemKey) === "META");
    if (!meta) {
      return { found: false };
    }

    const rows = (items || [])
      .filter((item) => toText(item?.itemKey) !== "META")
      .sort((a, b) => toText(a?.itemKey).localeCompare(toText(b?.itemKey)))
      .map((item) => {
        const { runId: _run, itemKey: _key, createdAt: _createdAt, ...rest } = item;
        return rest;
      });

    const wbsRows = await getWbsItemsForSet(toText(latestSet.setId));

    return {
      found: true,
      data: {
        runId,
        wbsSetId: toText(meta?.wbsSetId),
        modelId: toText(meta?.modelId),
        totalElements: Number(meta?.totalElements) || rows.length,
        matchedElements: Number(meta?.matchedElements) || 0,
        unmatchedElements: Number(meta?.unmatchedElements) || 0,
        averageConfidence: Number(meta?.averageConfidence) || 0,
        createdAt: meta?.createdAt || null,
        rows,
        wbsRows,
      },
    };
  },
};
