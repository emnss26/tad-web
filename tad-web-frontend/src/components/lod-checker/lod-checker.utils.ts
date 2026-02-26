import { DEFAULT_CONCEPTS_BY_DISCIPLINE } from "./lod-checker.types";
import type { GeometryStatus, LodCheckerRow } from "./lod-checker.types";
import type { LodCheckerApiRow } from "@/services/model.checker.service";

function normalizeConcept(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function createGeometryStatus(value: "Y" | "N" | "NA" | string | null = null): GeometryStatus {
  const normalized = String(value ?? "").toUpperCase().trim();
  return {
    y: normalized === "Y",
    n: normalized === "N",
    na: normalized === "NA",
  };
}

export function formatGeometryStatus(value: GeometryStatus): "Y" | "N" | "NA" | null {
  if (value.y) return "Y";
  if (value.n) return "N";
  if (value.na) return "NA";
  return null;
}

export function makeDefaultRows(discipline: string): LodCheckerRow[] {
  const concepts = DEFAULT_CONCEPTS_BY_DISCIPLINE[discipline] || [];

  return concepts.map((item, index) => ({
    row: index + 1,
    concepto: item.concept,
    lodRequerido: item.lod,
    geometriaCompleta: createGeometryStatus(null),
    lodCompletion: createGeometryStatus(null),
    comentarios: "",
  }));
}

export function apiRowsToUiRows(rows: LodCheckerApiRow[], fallbackDiscipline: string): LodCheckerRow[] {
  const defaults = makeDefaultRows(fallbackDiscipline);
  if (!Array.isArray(rows) || rows.length === 0) {
    return defaults;
  }

  const normalizedRows = rows
    .map((row) => ({
      row: Number(row.row),
      concepto: row.concept,
      lodRequerido: Number(row.req_lod) || 0,
      geometriaCompleta: createGeometryStatus(row.complet_geometry),
      lodCompletion: createGeometryStatus(row.lod_compliance),
      comentarios: row.comments || "",
    }))
    .sort((a, b) => a.row - b.row);

  const byConcept = new Map<string, LodCheckerRow>();
  normalizedRows.forEach((row) => {
    byConcept.set(normalizeConcept(row.concepto), row);
  });

  const mergedDefaults = defaults.map((defaultRow) => {
    const matchByConcept = byConcept.get(normalizeConcept(defaultRow.concepto));
    if (matchByConcept) {
      return {
        ...defaultRow,
        lodRequerido: matchByConcept.lodRequerido || defaultRow.lodRequerido,
        geometriaCompleta: matchByConcept.geometriaCompleta,
        lodCompletion: matchByConcept.lodCompletion,
        comentarios: matchByConcept.comentarios || "",
      };
    }

    const matchByRow = normalizedRows.find((row) => row.row === defaultRow.row);
    if (matchByRow) {
      return {
        ...defaultRow,
        lodRequerido: matchByRow.lodRequerido || defaultRow.lodRequerido,
        geometriaCompleta: matchByRow.geometriaCompleta,
        lodCompletion: matchByRow.lodCompletion,
        comentarios: matchByRow.comentarios || "",
      };
    }

    return defaultRow;
  });

  const defaultConcepts = new Set(mergedDefaults.map((row) => normalizeConcept(row.concepto)));
  const customRows = normalizedRows.filter((row) => !defaultConcepts.has(normalizeConcept(row.concepto)));

  return [...mergedDefaults, ...customRows].sort((a, b) => a.row - b.row || a.concepto.localeCompare(b.concepto));
}
