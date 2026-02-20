import { randomUUID } from "crypto";

export const normalizeProjectId = (projectId: string): string => {
  const clean = String(projectId || "").trim();
  return clean.startsWith("b.") ? clean.substring(2) : clean;
};

export const normalizeModelId = (modelId: string): string =>
  String(modelId || "").trim();

export const normalizeDiscipline = (discipline: string): string =>
  String(discipline || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export const normalizeSheetNumber = (sheetNumber: string): string =>
  String(sheetNumber || "").trim().toUpperCase();

export const normalizeTaskId = (taskId?: string): string => {
  const clean = String(taskId || "").trim();
  if (!clean) return `TASK#${randomUUID()}`;
  return clean.startsWith("TASK#") ? clean : `TASK#${clean}`;
};

export const buildModelKey = (projectId: string, modelId: string): string =>
  `PROJECT#${normalizeProjectId(projectId)}#MODEL#${normalizeModelId(modelId)}`;

export const buildSheetKey = (discipline: string, sheetNumber: string): string =>
  `DISC#${normalizeDiscipline(discipline)}#SHEET#${normalizeSheetNumber(sheetNumber)}`;

export const computePlanStatus = (
  actualGenerationDate?: string,
  actualIssueDate?: string
): "PLANNED" | "GENERATED" | "ISSUED" => {
  if (actualIssueDate) return "ISSUED";
  if (actualGenerationDate) return "GENERATED";
  return "PLANNED";
};

export const normalizeIsoDate = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
};

