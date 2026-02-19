import { DEFAULT_CONCEPTS_BY_DISCIPLINE } from "./lod-checker.types";
import type { GeometryStatus, LodCheckerRow } from "./lod-checker.types";
import type { LodCheckerApiRow } from "@/services/model.checker.service";

export function createGeometryStatus(value: "Y" | "N" | "NA" | string = "N"): GeometryStatus {
  const normalized = value.toUpperCase();
  return {
    y: normalized === "Y",
    n: normalized === "N",
    na: normalized === "NA",
  };
}

export function formatGeometryStatus(value: GeometryStatus): "Y" | "N" | "NA" {
  if (value.y) return "Y";
  if (value.na) return "NA";
  return "N";
}

export function makeDefaultRows(discipline: string): LodCheckerRow[] {
  const concepts = DEFAULT_CONCEPTS_BY_DISCIPLINE[discipline] || [];

  return concepts.map((item, index) => ({
    row: index + 1,
    concepto: item.concept,
    lodRequerido: item.lod,
    geometriaCompleta: createGeometryStatus("N"),
    lodCompletion: createGeometryStatus("N"),
    comentarios: "",
  }));
}

export function apiRowsToUiRows(rows: LodCheckerApiRow[], fallbackDiscipline: string): LodCheckerRow[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return makeDefaultRows(fallbackDiscipline);
  }

  return rows
    .map((row) => ({
      row: Number(row.row),
      concepto: row.concept,
      lodRequerido: Number(row.req_lod) || 0,
      geometriaCompleta: createGeometryStatus(row.complet_geometry),
      lodCompletion: createGeometryStatus(row.lod_compliance),
      comentarios: row.comments || "",
    }))
    .sort((a, b) => a.row - b.row);
}
