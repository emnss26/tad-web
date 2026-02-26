import { randomUUID } from "crypto";
import config from "../config";
import { DynamoLib } from "../libs/db/dynamo.lib";

const CHECKS_TABLE = config.aws.dynamo.tableName.parameterChecks;
const ELEMENTS_TABLE = config.aws.dynamo.tableName.parameterElements;

const CHECKS_KEY = {
  pk: "projectId",
  sk: "checkKey",
};

const ELEMENTS_KEY = {
  pk: "checkId",
  sk: "elementKey",
};

const toText = (value: unknown): string => String(value ?? "").trim();

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeToken = (value: string): string => encodeURIComponent(toText(value).toLowerCase());

const parseIsoDate = (value: unknown): string => {
  const raw = toText(value);
  if (!raw) return new Date().toISOString();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const buildLatestCheckKey = (modelId: string, disciplineId: string): string =>
  `MODEL#${normalizeToken(modelId)}#DISC#${normalizeToken(disciplineId)}#LATEST`;

const extractCompliancePct = (row: any): number => {
  const direct = toFiniteNumber(row?.compliance?.pct, NaN);
  if (Number.isFinite(direct)) {
    return Math.max(0, Math.min(100, Math.round(direct)));
  }

  const fields = [
    row?.revitElementId,
    row?.category,
    row?.familyName,
    row?.elementName,
    row?.typeMark,
    row?.description,
    row?.model,
    row?.manufacturer,
    row?.assemblyCode,
    row?.assemblyDescription,
  ];

  const filled = fields.filter((value) => toText(value) !== "").length;
  return Math.round((filled / fields.length) * 100);
};

const buildSummaryFromRows = (rows: any[]) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const totalElements = safeRows.length;
  if (!totalElements) {
    return {
      totalElements: 0,
      averageCompliancePct: 0,
      fullyCompliant: 0,
    };
  }

  const pcts = safeRows.map(extractCompliancePct);
  const sum = pcts.reduce((acc, pct) => acc + pct, 0);
  const fullyCompliant = pcts.filter((pct) => pct >= 100).length;

  return {
    totalElements,
    averageCompliancePct: Math.round(sum / totalElements),
    fullyCompliant,
  };
};

const compactElementRow = (row: any) => ({
  viewerDbId: row?.viewerDbId ?? null,
  dbId: row?.dbId ?? null,
  elementId: toText(row?.elementId),
  externalElementId: toText(row?.externalElementId),
  revitElementId: toText(row?.revitElementId),
  category: toText(row?.category),
  familyName: toText(row?.familyName),
  elementName: toText(row?.elementName),
  typeMark: toText(row?.typeMark),
  description: toText(row?.description),
  model: toText(row?.model),
  manufacturer: toText(row?.manufacturer),
  assemblyCode: toText(row?.assemblyCode),
  assemblyDescription: toText(row?.assemblyDescription),
  analysisCategoryId: toText(row?.analysisCategoryId),
  analysisCategoryName: toText(row?.analysisCategoryName),
  analysisCategoryQuery: toText(row?.analysisCategoryQuery),
  count: Math.max(1, Math.round(toFiniteNumber(row?.count, 1))),
  compliance: {
    pct: extractCompliancePct(row),
  },
  rawProperties: Array.isArray(row?.rawProperties) ? row.rawProperties : [],
});

const getLatestByGroup = <T>(
  rows: T[],
  getKey: (item: T) => string,
  getDate: (item: T) => string
): T[] => {
  const map = new Map<string, T>();

  rows.forEach((row) => {
    const key = getKey(row);
    if (!key) return;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, row);
      return;
    }

    const existingDate = new Date(getDate(existing)).getTime();
    const candidateDate = new Date(getDate(row)).getTime();
    if (candidateDate >= existingDate) {
      map.set(key, row);
    }
  });

  return Array.from(map.values());
};

const deleteElementsByCheckId = async (checkId: string) => {
  if (!checkId) return;
  const rows = await DynamoLib.queryByPK({
    tableName: ELEMENTS_TABLE,
    pkName: ELEMENTS_KEY.pk,
    pkValue: checkId,
  });

  for (const row of rows || []) {
    await DynamoLib.deleteItem(ELEMENTS_TABLE, {
      [ELEMENTS_KEY.pk]: toText(row?.checkId),
      [ELEMENTS_KEY.sk]: toText(row?.elementKey),
    });
  }
};

export interface SaveParameterCheckInput {
  dmProjectId: string;
  aecProjectId: string;
  modelId: string;
  modelName?: string;
  disciplineId: string;
  categoryId?: string;
  rows: any[];
  summary?: {
    totalElements?: number;
    averageCompliancePct?: number;
    fullyCompliant?: number;
  };
}

export const AecParametersService = {
  async saveCheck(input: SaveParameterCheckInput) {
    const dmProjectId = toText(input.dmProjectId);
    const aecProjectId = toText(input.aecProjectId);
    const modelId = toText(input.modelId);
    const modelName = toText(input.modelName);
    const disciplineId = toText(input.disciplineId);
    const categoryId = toText(input.categoryId) || "ALL";
    const rows = Array.isArray(input.rows) ? input.rows : [];

    if (!dmProjectId || !aecProjectId || !modelId || !disciplineId) {
      throw new Error("Missing required fields to save parameter check");
    }

    const compactRows = rows.map(compactElementRow);
    const summaryFromRows = buildSummaryFromRows(compactRows);
    const summary = {
      totalElements: toFiniteNumber(input.summary?.totalElements, summaryFromRows.totalElements),
      averageCompliancePct: toFiniteNumber(input.summary?.averageCompliancePct, summaryFromRows.averageCompliancePct),
      fullyCompliant: toFiniteNumber(input.summary?.fullyCompliant, summaryFromRows.fullyCompliant),
    };

    const checkKey = buildLatestCheckKey(modelId, disciplineId);
    const existingCheck = await DynamoLib.getItem(CHECKS_TABLE, {
      [CHECKS_KEY.pk]: dmProjectId,
      [CHECKS_KEY.sk]: checkKey,
    });

    const existingCheckId = toText(existingCheck?.checkId);
    if (existingCheckId) {
      await deleteElementsByCheckId(existingCheckId);
      await DynamoLib.deleteItem(CHECKS_TABLE, {
        [CHECKS_KEY.pk]: dmProjectId,
        [CHECKS_KEY.sk]: checkKey,
      });
    }

    const now = new Date();
    const createdAt = now.toISOString();
    const checkId = `CHECK#${now.getTime()}#${randomUUID()}`;

    const checkItem = {
      [CHECKS_KEY.pk]: dmProjectId,
      [CHECKS_KEY.sk]: checkKey,
      checkId,
      dmProjectId,
      aecProjectId,
      modelId,
      modelName,
      disciplineId,
      categoryId,
      totalElements: summary.totalElements,
      averageCompliancePct: summary.averageCompliancePct,
      fullyCompliant: summary.fullyCompliant,
      createdAt,
      updatedAt: createdAt,
    };

    await DynamoLib.saveItem(CHECKS_TABLE, checkItem);

    if (compactRows.length > 0) {
      const elementItems = compactRows.map((row, index) => ({
        [ELEMENTS_KEY.pk]: checkId,
        [ELEMENTS_KEY.sk]: `EL#${String(index + 1).padStart(6, "0")}`,
        ...row,
        createdAt,
      }));

      await DynamoLib.batchWriteWithRetry(ELEMENTS_TABLE, elementItems, {
        chunkSize: 25,
        maxRetries: 5,
      });
    }

    return {
      checkId,
      savedElements: compactRows.length,
      summary,
    };
  },

  async getLastCheck({
    dmProjectId,
    modelId,
    disciplineId,
  }: {
    dmProjectId: string;
    modelId: string;
    disciplineId: string;
  }) {
    const latestCheckKey = buildLatestCheckKey(modelId, disciplineId);
    let check = await DynamoLib.getItem(CHECKS_TABLE, {
      [CHECKS_KEY.pk]: toText(dmProjectId),
      [CHECKS_KEY.sk]: latestCheckKey,
    });

    if (!check?.checkId) {
      const checks = await DynamoLib.queryByPK({
        tableName: CHECKS_TABLE,
        pkName: CHECKS_KEY.pk,
        pkValue: toText(dmProjectId),
      });

      const fallback = (checks || [])
        .filter(
          (item) =>
            toText(item?.modelId) === toText(modelId) && toText(item?.disciplineId) === toText(disciplineId)
        )
        .sort((a, b) => new Date(parseIsoDate(b?.createdAt)).getTime() - new Date(parseIsoDate(a?.createdAt)).getTime());

      check = fallback[0] || null;
    }

    if (!check?.checkId) {
      return { found: false };
    }

    const storedRows = await DynamoLib.queryByPK({
      tableName: ELEMENTS_TABLE,
      pkName: ELEMENTS_KEY.pk,
      pkValue: String(check.checkId),
    });

    const rows = (Array.isArray(storedRows) ? storedRows : [])
      .sort((a, b) => String(a?.elementKey || "").localeCompare(String(b?.elementKey || "")))
      .map((item) => {
        const { checkId: _c, elementKey: _k, createdAt: _createdAt, ...rest } = item || {};
        return rest;
      });

    const summary = {
      totalElements: toFiniteNumber(check?.totalElements, rows.length),
      averageCompliancePct: toFiniteNumber(check?.averageCompliancePct, 0),
      fullyCompliant: toFiniteNumber(check?.fullyCompliant, 0),
    };

    return {
      found: true,
      checkData: check,
      data: {
        rows,
        summary,
      },
    };
  },

  async getLastDisciplineByModel(dmProjectId: string, modelId: string) {
    const checks = await DynamoLib.queryByPK({
      tableName: CHECKS_TABLE,
      pkName: CHECKS_KEY.pk,
      pkValue: toText(dmProjectId),
    });

    const latest = (checks || [])
      .filter((item) => toText(item?.modelId) === toText(modelId))
      .sort((a, b) => new Date(parseIsoDate(b?.createdAt)).getTime() - new Date(parseIsoDate(a?.createdAt)).getTime())[0];

    if (!latest) {
      return { found: false };
    }

    return {
      found: true,
      data: {
        checkId: toText(latest.checkId),
        disciplineId: toText(latest.disciplineId),
        categoryId: toText(latest.categoryId) || "ALL",
        createdAt: parseIsoDate(latest.createdAt),
      },
    };
  },

  async getProjectCompliance(dmProjectId: string) {
    const checks = await DynamoLib.queryByPK({
      tableName: CHECKS_TABLE,
      pkName: CHECKS_KEY.pk,
      pkValue: toText(dmProjectId),
    });

    const latestByModelDiscipline = getLatestByGroup(
      checks || [],
      (item) => [toText(item?.modelId), toText(item?.disciplineId)].join("::"),
      (item) => parseIsoDate(item?.createdAt)
    );

    type ModelRollup = {
      modelId: string;
      modelName: string;
      totalElements: number;
      disciplineCount: number;
      complianceSum: number;
      latestCheckId: string | null;
      latestCheckAt: string | null;
    };

    const rollups = new Map<string, ModelRollup>();

    latestByModelDiscipline.forEach((item) => {
      const modelId = toText(item?.modelId);
      if (!modelId) return;
      const createdAt = parseIsoDate(item?.createdAt);
      const totalElements = toFiniteNumber(item?.totalElements, 0);
      const averageCompliancePct = toFiniteNumber(item?.averageCompliancePct, 0);
      const modelName = toText(item?.modelName);

      const current = rollups.get(modelId) || {
        modelId,
        modelName,
        totalElements: 0,
        disciplineCount: 0,
        complianceSum: 0,
        latestCheckId: null,
        latestCheckAt: null,
      };

      current.totalElements += totalElements;
      current.disciplineCount += 1;
      current.complianceSum += averageCompliancePct;
      if (modelName) current.modelName = modelName;

      const currentDate = current.latestCheckAt ? new Date(current.latestCheckAt).getTime() : 0;
      const nextDate = new Date(createdAt).getTime();
      if (nextDate >= currentDate) {
        current.latestCheckAt = createdAt;
        current.latestCheckId = toText(item?.checkId) || current.latestCheckId;
      }

      rollups.set(modelId, current);
    });

    const rows = Array.from(rollups.values())
      .map((item) => ({
        modelId: item.modelId,
        modelName: item.modelName,
        totalElements: item.totalElements,
        modelCompliancePct: item.disciplineCount > 0 ? Math.round(item.complianceSum / item.disciplineCount) : 0,
        latestCheckId: item.latestCheckId,
        lastCheckAt: item.latestCheckAt,
      }))
      .sort((a, b) => a.modelId.localeCompare(b.modelId));

    const grandTotalElements = rows.reduce((acc, row) => acc + row.totalElements, 0);
    const complianceWeightedSum = rows.reduce((acc, row) => acc + row.modelCompliancePct * row.totalElements, 0);

    return {
      rows,
      grandTotal: {
        totalElements: grandTotalElements,
        averageCompliancePct:
          grandTotalElements > 0 ? Math.round(complianceWeightedSum / grandTotalElements) : 0,
        analyzedModels: rows.length,
        updatedAt: new Date().toISOString(),
      },
    };
  },
};

