import axios from "axios";

const AEC_GRAPHQL_URL = "https://developer.api.autodesk.com/aec/graphql";
const ELEMENT_PAGE_LIMIT = 200;
const AEC_REQUEST_TIMEOUT_MS = 45000;
const AEC_RETRY_ATTEMPTS = 3;
const BULK_CONTEXT_FILTER = "'property.name.Element Context'==Instance";

const CATEGORY_ALIASES: Record<string, string[]> = {
  "Curtain Panels / Mullions": [
    "CurtainPanels",
    "CurtainPanel",
    "CurtainWallMullions",
    "CurtainMullions",
    "CurtainPanelsMullions",
  ],
};

export interface IAecRawProperty {
  name: string;
  value: unknown;
  definition: {
    id: string;
    name: string;
    description: string;
    specification: string;
  };
}

export interface IAecElementRow {
  viewerDbId: number | null;
  dbId: number | string | null;
  elementId: string;
  externalElementId: string;
  revitElementId: string;
  category: string;
  familyName: string;
  elementName: string;
  typeMark: string;
  description: string;
  model: string;
  manufacturer: string;
  assemblyCode: string;
  assemblyDescription: string;
  count: number;
  rawProperties: IAecRawProperty[];
  compliance: {
    filled: number;
    total: number;
    pct: number;
  };
}

export interface IAecModelParametersByCategoryResult {
  modelId: string;
  modelName: string | null;
  category: string;
  resolvedCategoryToken: string | null;
  filterQueryUsed: string | null;
  rows: IAecElementRow[];
  propertyDefinitions: Array<Record<string, unknown>>;
  summary: {
    totalElements: number;
    averageCompliancePct: number;
    fullyCompliant: number;
  };
}

const toText = (value: unknown): string => {
  if (value === undefined || value === null) return "";

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    return value.map(toText).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    const typed = value as Record<string, unknown>;
    if ("displayValue" in typed) return toText(typed.displayValue);
    if ("value" in typed) return toText(typed.value);
    if ("name" in typed) return toText(typed.name);
    if ("label" in typed) return toText(typed.label);
  }

  return "";
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableAxiosError = (error: any): boolean => {
  const status = Number(error?.response?.status || 0);
  const code = String(error?.code || "");
  if ([429, 502, 503, 504].includes(status)) return true;
  if (code === "ECONNABORTED" || code === "ETIMEDOUT") return true;
  return false;
};

const normalize = (value: unknown): string => String(value || "").trim().toLowerCase();

const toPositiveInt = (value: unknown): number | null => {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value <= 0) return null;
    return value;
  }

  const normalized = String(value || "").trim();
  if (!/^\d+$/.test(normalized)) return null;

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const pickProperty = (properties: any[], names: string | string[]): string => {
  const wanted = (Array.isArray(names) ? names : [names]).map(normalize);
  const hit = (properties || []).find((property) => wanted.includes(normalize(property?.name)));
  return toText(hit?.value);
};

const graphQlPost = async <T = any>(token: string, query: string, variables?: Record<string, unknown>): Promise<T> => {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= AEC_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await axios.post(
        AEC_GRAPHQL_URL,
        { query, variables },
        {
          timeout: AEC_REQUEST_TIMEOUT_MS,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const gqlErrors = data?.errors;
      if (Array.isArray(gqlErrors) && gqlErrors.length) {
        throw new Error(gqlErrors[0]?.message || "AEC GraphQL error");
      }

      return (data?.data || {}) as T;
    } catch (error: any) {
      lastError = error;
      if (!isRetryableAxiosError(error) || attempt >= AEC_RETRY_ATTEMPTS) {
        throw error;
      }
      await sleep(350 * attempt);
    }
  }

  throw lastError || new Error("AEC GraphQL request failed");
};

const mapElementToRow = (element: any): IAecElementRow => {
  const properties = Array.isArray(element?.properties?.results) ? element.properties.results : [];
  const rawProperties: IAecRawProperty[] = properties.map((property: any) => ({
    name: toText(property?.name),
    value: property?.value ?? null,
    definition: {
      id: toText(property?.definition?.id),
      name: toText(property?.definition?.name),
      description: toText(property?.definition?.description),
      specification: toText(property?.definition?.specification),
    },
  }));

  const revitElementIdFromAlt = toText(element?.alternativeIdentifiers?.revitElementId);
  const revitElementId =
    revitElementIdFromAlt || pickProperty(properties, ["Revit Element ID", "Element Id", "ElementId", "Id"]);
  const category = pickProperty(properties, ["Revit Category Type Id", "Category", "Category Name"]);
  const familyName = pickProperty(properties, ["Family Name", "Family"]);
  const elementName = pickProperty(properties, ["Element Name", "Name"]) || toText(element?.name);
  const typeMark = pickProperty(properties, ["Type Mark", "Mark"]);
  const description = pickProperty(properties, ["Description", "Type Description"]);
  const model = pickProperty(properties, ["Model", "Model Number", "Modelo"]);
  const manufacturer = pickProperty(properties, ["Manufacturer", "Fabricante"]);
  const assemblyCode = pickProperty(properties, ["Assembly Code", "OmniClass Number"]);
  const assemblyDescription = pickProperty(properties, ["Assembly Description", "OmniClass Title"]);

  const elementId = toText(element?.id);
  const explicitDbId = pickProperty(properties, ["DbId", "dbId", "Db Id"]);
  const viewerDbId = toPositiveInt(explicitDbId) || toPositiveInt(element?.dbId) || toPositiveInt(elementId) || null;
  const dbId = viewerDbId || explicitDbId || revitElementId || elementId || null;

  const required = [
    revitElementId,
    category,
    familyName,
    elementName,
    typeMark,
    description,
    model,
    manufacturer,
    assemblyCode,
    assemblyDescription,
  ];

  const filled = required.filter((value) => String(value || "").trim() !== "").length;
  const total = required.length;
  const compliancePct = total > 0 ? Math.round((filled / total) * 100) : 0;

  return {
    viewerDbId,
    dbId,
    elementId,
    externalElementId: toText(element?.alternativeIdentifiers?.externalElementId),
    revitElementId,
    category,
    familyName,
    elementName,
    typeMark,
    description,
    model,
    manufacturer,
    assemblyCode,
    assemblyDescription,
    count: 1,
    rawProperties,
    compliance: {
      filled,
      total,
      pct: compliancePct,
    },
  };
};

const singularizeWord = (word: string): string => {
  if (!word) return "";
  if (/ies$/i.test(word)) return `${word.slice(0, -3)}y`;
  if (/sses$/i.test(word)) return word;
  if (/s$/i.test(word) && word.length > 3) return word.slice(0, -1);
  return word;
};

const buildCategoryCandidates = (category: string): string[] => {
  const raw = String(category || "").trim();
  if (!raw) throw new Error("Missing category");

  const candidates: string[] = [];
  const pushCandidate = (candidate: string) => {
    const normalized = String(candidate || "").trim();
    if (!normalized) return;
    if (candidates.includes(normalized)) return;
    candidates.push(normalized);
  };

  pushCandidate(raw);

  const words = raw.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const compact = words.join("");
  const pascal = words.map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join("");
  const compactSingular = words.map(singularizeWord).join("");
  const pascalSingular = words
    .map((word) => singularizeWord(word))
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join("");

  pushCandidate(compact);
  pushCandidate(pascal);
  pushCandidate(compactSingular);
  pushCandidate(pascalSingular);

  (CATEGORY_ALIASES[raw] || []).forEach(pushCandidate);

  if (!candidates.length) {
    throw new Error(`Invalid category token: ${raw}`);
  }

  return candidates;
};

const isFilterSyntaxError = (error: unknown): boolean => {
  const message = String((error as { message?: string })?.message || "");
  return /Error with query syntax|Lexical error/i.test(message);
};

const quoteIfNeeded = (candidate: string): string => (/\s/.test(candidate) ? `'${candidate}'` : candidate);

const fetchRowsByPropertyFilter = async ({
  token,
  elementGroupId,
  propertyFilter,
}: {
  token: string;
  elementGroupId: string;
  propertyFilter: string;
}): Promise<IAecElementRow[]> => {
  const modelElementsQuery = `
    query GetElementsFromCategory($elementGroupId: ID!, $propertyFilter: String!, $cursor: String) {
      elementsByElementGroup(
        elementGroupId: $elementGroupId,
        filter: { query: $propertyFilter },
        pagination: { cursor: $cursor, limit: ${ELEMENT_PAGE_LIMIT} }
      ) {
        pagination { cursor pageSize }
        results {
          id
          name
          alternativeIdentifiers {
            revitElementId
            externalElementId
          }
          properties {
            results {
              name
              value
            }
          }
        }
      }
    }
  `;

  const rows: IAecElementRow[] = [];
  let cursor: string | null = null;

  while (true) {
    const gqlData: any = await graphQlPost<any>(token, modelElementsQuery, {
      elementGroupId,
      propertyFilter,
      cursor,
    });

    const payload: any = gqlData?.elementsByElementGroup;
    const page = Array.isArray(payload?.results) ? payload.results : [];
    if (page.length) rows.push(...page.map(mapElementToRow));

    cursor = payload?.pagination?.cursor || null;
    if (!cursor) break;
  }

  return rows;
};

const resolveRowsForCategory = async ({
  token,
  modelId,
  category,
}: {
  token: string;
  modelId: string;
  category: string;
}) => {
  const candidates = buildCategoryCandidates(category);

  const withContext = (candidate: string) =>
    `property.name.category==${quoteIfNeeded(candidate)} and ${BULK_CONTEXT_FILTER}`;
  const withoutContext = (candidate: string) => `property.name.category==${quoteIfNeeded(candidate)}`;

  let firstSuccessfulEmpty: { rows: IAecElementRow[]; resolvedCategoryToken: string; filterQueryUsed: string } | null =
    null;
  let lastSyntaxError: unknown = null;

  for (const candidate of candidates) {
    const filters = [withContext(candidate), withoutContext(candidate)];
    for (const propertyFilter of filters) {
      try {
        const rows = await fetchRowsByPropertyFilter({
          token,
          elementGroupId: modelId,
          propertyFilter,
        });

        if (rows.length > 0) {
          return { rows, resolvedCategoryToken: candidate, filterQueryUsed: propertyFilter };
        }

        if (!firstSuccessfulEmpty) {
          firstSuccessfulEmpty = {
            rows,
            resolvedCategoryToken: candidate,
            filterQueryUsed: propertyFilter,
          };
        }
      } catch (error) {
        if (isFilterSyntaxError(error)) {
          lastSyntaxError = error;
          continue;
        }
        throw error;
      }
    }
  }

  if (firstSuccessfulEmpty) return firstSuccessfulEmpty;

  if (lastSyntaxError) {
    throw new Error(
      `Could not build a valid filter for category '${category}'. ${
        (lastSyntaxError as { message?: string })?.message || ""
      }`.trim()
    );
  }

  return {
    rows: [] as IAecElementRow[],
    resolvedCategoryToken: null as string | null,
    filterQueryUsed: null as string | null,
  };
};

export async function fetchAllElementsByModel(token: string, modelId: string): Promise<IAecElementRow[]> {
  return fetchRowsByPropertyFilter({
    token,
    elementGroupId: modelId,
    propertyFilter: BULK_CONTEXT_FILTER,
  });
}

export async function fetchModelParametersByCategory(
  token: string,
  projectId: string,
  modelId: string,
  category: string
): Promise<IAecModelParametersByCategoryResult> {
  if (!token) throw new Error("Missing APS access token");
  if (!projectId) throw new Error("Missing projectId");
  if (!modelId) throw new Error("Missing modelId");

  const normalizedCategory = String(category || "").trim();
  if (!normalizedCategory) throw new Error("Missing category");

  const resolved = await resolveRowsForCategory({
    token,
    modelId,
    category: normalizedCategory,
  });

  const rows = resolved.rows;
  const totalElements = rows.length;
  const averageCompliancePct =
    totalElements > 0
      ? Math.round(rows.reduce((acc, row) => acc + (row.compliance?.pct || 0), 0) / totalElements)
      : 0;

  return {
    modelId,
    modelName: null,
    category: normalizedCategory,
    resolvedCategoryToken: resolved.resolvedCategoryToken,
    filterQueryUsed: resolved.filterQueryUsed,
    rows,
    propertyDefinitions: [],
    summary: {
      totalElements,
      averageCompliancePct,
      fullyCompliant: rows.filter((row) => (row.compliance?.pct || 0) === 100).length,
    },
  };
}
