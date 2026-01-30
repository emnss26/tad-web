import { DynamoLib } from "../libs/db/dynamo.lib";
import config from "../config";

const TABLE = config.aws.dynamo.tableName.models;

// ✅ Key schema REAL de Tad_Model_Data
const KEY = {
  pk: "modelId",     // Partition Key (String)
  sk: "elementId",   // Sort Key (String)
};

// whitelist para PATCH (evita que te metan un UpdateExpression raro)
const ALLOWED_FIELDS = new Set([
  "Code","Discipline","ElementType","TypeName","Description","TypeMark",
  "Length","Width","Height","Perimeter","Area","Volume","Thickness",
  "Level","Material",
  "PlanedConstructionStartDate","PlanedConstructionEndDate",
  "RealConstructionStartDate","RealConstructionEndDate",
  "Unit","Quantity","UnitCost","TotalCost",
  "EnergyConsumption","WaterConsumption","CarbonFootprint","LifeCycleStage",
  "LEEDcreditCategory","LEEDcredit","Manufacturer","Model","Keynote",
  "Comments","Warranty","MaintenancePeriod","MaintenanceSchedule",
  "MaintenanceCost","SerialNumber",
  // extras para tu puente con Revit:
  "externalId","revitElementId","revitUniqueId",
  // por si guardas dbId como campo normal:
  "dbId"
]);

function nowIso() {
  return new Date().toISOString();
}

/**
 * ✅ modelId en la tabla es String.
 * Para evitar colisiones entre proyectos/cuentas, lo hacemos compuesto.
 */
function buildModelId(accountId: string, projectId: string, modelId: string) {
  return `ACC#${accountId}#PROJ#${projectId}#MODEL#${modelId}`;
}

/**
 * ✅ elementId es String. Usamos dbId como elementId (porque es único por modelo).
 * Si luego quieres usar externalId/UniqueId como SK, aquí lo cambias.
 */
function buildElementIdFromDbId(dbId: any) {
  const s = String(dbId ?? "").trim();
  if (!s) return null;
  return `DBID#${s}`;
}

function normalizeRow(row: any) {
  const clean: any = { ...row };

  // dbId siempre string como atributo (aunque SK sea elementId)
  if (clean.dbId != null) clean.dbId = String(clean.dbId).trim();

  // fechas: elimina vacíos
  const dateFields = [
    "PlanedConstructionStartDate","PlanedConstructionEndDate",
    "RealConstructionStartDate","RealConstructionEndDate"
  ];
  for (const f of dateFields) {
    if (clean[f] === "") delete clean[f];
  }

  // números: convierte strings a number
  const numeric = [
    "Length","Width","Height","Perimeter","Area","Volume","Thickness",
    "Quantity","UnitCost","TotalCost",
    "EnergyConsumption","WaterConsumption","CarbonFootprint","MaintenanceCost"
  ];
  for (const f of numeric) {
    const v = clean[f];
    if (typeof v === "string") {
      const n = parseFloat(v);
      if (Number.isFinite(n)) clean[f] = n;
      else delete clean[f];
    }
    if (clean[f] === undefined) delete clean[f];
  }

  // limpia null/undefined
  Object.keys(clean).forEach((k) => {
    if (clean[k] === null || clean[k] === undefined) delete clean[k];
  });

  return clean;
}

export const ModelDataService = {
  async upsertRows({
    accountId,
    projectId,
    modelId,
    rows,
  }: {
    accountId: string;
    projectId: string;
    modelId: string;
    rows: any[];
  }) {
    const modelKey = buildModelId(accountId, projectId, modelId);

    const items = (rows || [])
      .filter((r) => r && r.dbId != null && String(r.dbId).trim())
      .map((r) => {
        const elementId = buildElementIdFromDbId(r.dbId);
        if (!elementId) return null;

        const base = normalizeRow(r);

        return {
          // ✅ Dynamo Keys reales
          [KEY.pk]: modelKey,
          [KEY.sk]: elementId,

          // duplicados útiles
          accountId,
          projectId,
          modelIdRaw: modelId,

          // para debug / compat frontend
          elementId,
          dbId: String(r.dbId).trim(),

          // payload
          ...base,

          updatedAt: nowIso(),
        };
      })
      .filter(Boolean) as any[];

    if (!items.length) return { processed: 0, message: "No valid rows" };

    // BatchWrite (25 max) con retry
    const result = await DynamoLib.batchWriteWithRetry(TABLE, items);
    return { ...result, message: "Batch processed" };
  },

  async getRows({
    accountId,
    projectId,
    modelId,
    discipline,
  }: {
    accountId: string;
    projectId: string;
    modelId: string;
    discipline?: string;
  }) {
    const modelKey = buildModelId(accountId, projectId, modelId);

    // ✅ Query por PK real (modelId)
    const all = await DynamoLib.queryByPK({
      tableName: TABLE,
      pkName: KEY.pk,
      pkValue: modelKey,
    });

    // Si piden disciplina, filtra en memoria (tu tabla no muestra GSIs configurados)
    if (discipline && discipline !== "All Disciplines") {
      return (all || []).filter((x: any) => x?.Discipline === discipline);
    }

    return all;
  },

  async patchField({
    accountId,
    projectId,
    modelId,
    dbId,
    field,
    value,
  }: {
    accountId: string;
    projectId: string;
    modelId: string;
    dbId: string | number;
    field: string;
    value: any;
  }) {
    if (!ALLOWED_FIELDS.has(field)) {
      throw new Error(`Field not allowed: ${field}`);
    }

    const modelKey = buildModelId(accountId, projectId, modelId);
    const elementId = buildElementIdFromDbId(dbId);
    if (!elementId) throw new Error("Invalid dbId/elementId");

    await DynamoLib.updateField(
      TABLE,
      { [KEY.pk]: modelKey, [KEY.sk]: elementId },
      field,
      value
    );

    return true;
  },
};
