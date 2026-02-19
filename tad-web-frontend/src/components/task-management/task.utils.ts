import { format as formatDateFns, isValid, parseISO } from "date-fns";

export function formatTaskDate(dateInput?: string | null): string {
  if (!dateInput) return "";

  const parsed = parseISO(dateInput);
  if (!isValid(parsed)) return "";

  return formatDateFns(parsed, "dd/MM/yyyy");
}

export function getNextTaskId(existingTaskIds: string[], projectId: string): string {
  const max = existingTaskIds.reduce((currentMax, id) => {
    const match = String(id || "").match(/(\d+)$/);
    if (!match) return currentMax;
    const numeric = Number(match[1]);
    if (Number.isNaN(numeric)) return currentMax;
    return Math.max(currentMax, numeric);
  }, 0);

  return `${projectId}-${max + 1}`;
}
