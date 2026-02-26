import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { AlertCircle, Loader2, Upload, Save, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AecService, type AecModel } from "@/services/aec.service";
import {
  clearViewerIsolation,
  isolateViewerDbIds,
  resolveViewerDbIdsForRows,
  simpleViewer,
  teardownSimpleViewer,
} from "@/utils/viewers/aec.simple.viewer";

interface ProjectAecWbsPlannerPageProps {
  platform: "acc" | "bim360";
}

interface WbsEditableRow {
  id: string;
  code: string;
  title: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
  plannedCost: string;
  duration: string;
}

interface MatchRow {
  viewerDbId: number | null;
  dbId: number | string | null;
  elementId: string;
  revitElementId: string;
  category: string;
  familyName: string;
  elementName: string;
  assemblyCode: string;
  assemblyDescription: string;
  matchedWbsCode: string | null;
  matchedWbsTitle: string | null;
  confidence: number;
  strategy: string;
}

interface HttpErrorLike {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

interface WbsApiRow {
  id?: string;
  code?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  plannedCost?: number | string | null;
  duration?: string;
}

const toText = (value: unknown): string => String(value ?? "").trim();
const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(toText(value));

const normalizeWbsCode = (value: unknown): string =>
  toText(value).replace(/\s+/g, "").replace(/\.+/g, ".").replace(/\.$/, "");

const isValidWbsCode = (value: string): boolean => /^\d+(\.\d+)*$/.test(normalizeWbsCode(value));

const splitWbsCodeParts = (value: string): string[] => {
  const normalized = normalizeWbsCode(value);
  if (!isValidWbsCode(normalized)) return [];
  return normalized.split(".").filter(Boolean);
};

const getWbsLevel = (value: string): number => splitWbsCodeParts(value).length;

const compareWbsCodes = (a: string, b: string): number => {
  const aParts = splitWbsCodeParts(a).map((p) => Number(p));
  const bParts = splitWbsCodeParts(b).map((p) => Number(p));
  const max = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < max; i += 1) {
    const av = Number.isFinite(aParts[i]) ? aParts[i] : -1;
    const bv = Number.isFinite(bParts[i]) ? bParts[i] : -1;
    if (av !== bv) return av - bv;
  }
  return 0;
};

const parseDateToIso = (value: unknown): string => {
  if (!value && value !== 0) return "";

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed?.y || !parsed?.m || !parsed?.d) return "";
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)).toISOString().slice(0, 10);
  }

  const raw = toText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmy) {
    let y = Number(dmy[3]);
    if (y < 100) y += 2000;
    const dt = new Date(Date.UTC(y, Number(dmy[2]) - 1, Number(dmy[1])));
    return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
  }

  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as HttpErrorLike).response?.data?.message || (error as HttpErrorLike).response?.data?.error;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as HttpErrorLike).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

const getCodeAtLevel = (value: string, level: number): string => {
  const parts = splitWbsCodeParts(value);
  if (!parts.length || parts.length < level) return "";
  return parts.slice(0, level).join(".");
};

const pickDeepestCodeFromLevels = (row: unknown[]): string => {
  const levelCells = [toText(row?.[0]), toText(row?.[1]), toText(row?.[2]), toText(row?.[3])];
  for (let i = levelCells.length - 1; i >= 0; i -= 1) {
    const candidate = normalizeWbsCode(levelCells[i]);
    if (isValidWbsCode(candidate)) return candidate;
  }
  return "";
};

const createLocalWbsRow = (partial: Partial<WbsEditableRow>): WbsEditableRow => ({
  id: toText(partial.id) || `wbs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  code: normalizeWbsCode(partial.code || ""),
  title: toText(partial.title),
  plannedStartDate: isIsoDate(toText(partial.plannedStartDate)) ? toText(partial.plannedStartDate) : "",
  plannedEndDate: isIsoDate(toText(partial.plannedEndDate)) ? toText(partial.plannedEndDate) : "",
  actualStartDate: isIsoDate(toText(partial.actualStartDate)) ? toText(partial.actualStartDate) : "",
  actualEndDate: isIsoDate(toText(partial.actualEndDate)) ? toText(partial.actualEndDate) : "",
  plannedCost: toText(partial.plannedCost),
  duration: toText(partial.duration),
});

export default function ProjectAecWbsPlannerPage({ platform }: ProjectAecWbsPlannerPageProps) {
  const { projectId } = useParams<{ projectId: string }>();

  const [models, setModels] = useState<AecModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedModelUrn, setSelectedModelUrn] = useState("");
  const [sourceFileName, setSourceFileName] = useState("");
  const [wbsSetId, setWbsSetId] = useState<string | null>(null);

  const [wbsRows, setWbsRows] = useState<WbsEditableRow[]>([]);
  const [matchRows, setMatchRows] = useState<MatchRow[]>([]);
  const [matchSummary, setMatchSummary] = useState({
    totalElements: 0,
    matchedElements: 0,
    unmatchedElements: 0,
    averageConfidence: 0,
  });

  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runningMatch, setRunningMatch] = useState(false);
  const [resolvingIsolation, setResolvingIsolation] = useState(false);
  const [playbackDate, setPlaybackDate] = useState("");
  const [timelineIndex, setTimelineIndex] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const selectionStorageKey = useMemo(() => `tad_aec_wbs_planner_model_${projectId || "unknown"}`, [projectId]);

  const playbackDates = useMemo(
    () =>
      Array.from(
        new Set(wbsRows.map((row) => row.plannedStartDate).filter((date) => isIsoDate(date)))
      ).sort(),
    [wbsRows]
  );

  const invalidRowsCount = useMemo(
    () =>
      wbsRows.filter((row) => {
        if (!isValidWbsCode(row.code)) return true;
        if (!toText(row.title)) return true;
        if (row.plannedStartDate && !isIsoDate(row.plannedStartDate)) return true;
        if (row.plannedEndDate && !isIsoDate(row.plannedEndDate)) return true;
        if (row.actualStartDate && !isIsoDate(row.actualStartDate)) return true;
        if (row.actualEndDate && !isIsoDate(row.actualEndDate)) return true;
        return false;
      }).length,
    [wbsRows]
  );

  const applyFrame = useCallback(
    async (frameIndex: number) => {
      if (!playbackDates.length || !matchRows.length) {
        setPlaybackDate("");
        clearViewerIsolation();
        return;
      }

      const safeIndex = Math.max(0, Math.min(frameIndex, playbackDates.length - 1));
      const frameDate = playbackDates[safeIndex];
      setTimelineIndex(safeIndex);
      setPlaybackDate(frameDate);

      const activeCodes = wbsRows
        .filter((row) => isIsoDate(row.plannedStartDate) && row.plannedStartDate <= frameDate)
        .map((row) => normalizeWbsCode(row.code))
        .filter(Boolean);

      const rowsToIsolate = matchRows.filter((row) =>
        activeCodes.includes(normalizeWbsCode(row.matchedWbsCode || ""))
      );
      const ids = await resolveViewerDbIdsForRows(rowsToIsolate);
      if (!ids.length) {
        clearViewerIsolation();
        return;
      }
      isolateViewerDbIds(ids);
    },
    [matchRows, playbackDates, wbsRows]
  );

  const loadModels = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingModels(true);
      const payload = await AecService.getModels(projectId);
      const modelRows = Array.isArray(payload.models) ? payload.models : [];
      setModels(modelRows);

      const stored = sessionStorage.getItem(selectionStorageKey);
      const preselected =
        modelRows.find((model) => String(model.id) === String(stored)) ||
        modelRows.find((model) => Boolean(model.urn)) ||
        modelRows[0];

      if (preselected?.id) {
        setSelectedModelId(String(preselected.id));
        setSelectedModelUrn(String(preselected.urn || ""));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load AEC models."));
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [projectId, selectionStorageKey]);

  const loadPlannerState = useCallback(
    async (modelId: string) => {
      if (!projectId || !modelId) return;
      try {
        setLoadingState(true);
        setError(null);

        const latestWbs = await AecService.getLatestWbs(projectId, modelId);
        if (latestWbs?.found && latestWbs?.data) {
          setWbsSetId(String(latestWbs.data.wbsSetId || ""));
          const rows = Array.isArray(latestWbs.data.rows) ? latestWbs.data.rows : [];
          setWbsRows(
            rows.map((row: WbsApiRow) =>
              createLocalWbsRow({
                id: String(row.id || ""),
                code: row.code,
                title: row.title,
                plannedStartDate: row.startDate || "",
                plannedEndDate: row.endDate || "",
                actualStartDate: row.actualStartDate || "",
                actualEndDate: row.actualEndDate || "",
                plannedCost: row.plannedCost != null ? String(row.plannedCost) : "",
                duration: row.duration || "",
              })
            )
          );
          setSourceFileName(String(latestWbs.data.sourceName || ""));
        } else {
          setWbsSetId(null);
          setWbsRows([]);
        }

        const latestMatch = await AecService.getLatestWbsMatch(projectId, modelId);
        if (latestMatch?.found && latestMatch?.data) {
          const rows = Array.isArray(latestMatch.data.rows) ? latestMatch.data.rows : [];
          setMatchRows(rows);
          setMatchSummary({
            totalElements: Number(latestMatch.data.totalElements) || rows.length,
            matchedElements: Number(latestMatch.data.matchedElements) || 0,
            unmatchedElements: Number(latestMatch.data.unmatchedElements) || 0,
            averageConfidence: Number(latestMatch.data.averageConfidence) || 0,
          });
        } else {
          setMatchRows([]);
          setMatchSummary({
            totalElements: 0,
            matchedElements: 0,
            unmatchedElements: 0,
            averageConfidence: 0,
          });
        }
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load the latest WBS state."));
      } finally {
        setLoadingState(false);
      }
    },
    [projectId]
  );

  const saveWbs = useCallback(async () => {
    if (!projectId || !selectedModelId) return;
    if (!wbsRows.length) {
      setError("There are no WBS rows to save.");
      return;
    }
    if (invalidRowsCount > 0) {
      setError("Fix invalid rows before saving.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payloadRows = wbsRows.map((row) => ({
        code: normalizeWbsCode(row.code),
        title: toText(row.title),
        level: getWbsLevel(row.code),
        startDate: isIsoDate(row.plannedStartDate) ? row.plannedStartDate : null,
        endDate: isIsoDate(row.plannedEndDate) ? row.plannedEndDate : null,
        actualStartDate: isIsoDate(row.actualStartDate) ? row.actualStartDate : null,
        actualEndDate: isIsoDate(row.actualEndDate) ? row.actualEndDate : null,
        plannedCost: row.plannedCost ? Number(row.plannedCost) : null,
        duration: toText(row.duration),
      }));

      const result = await AecService.saveWbs(projectId, {
        modelId: selectedModelId,
        sourceName: sourceFileName || "WBS_Manual",
        rows: payloadRows,
      });

      setWbsSetId(String(result?.wbsSetId || ""));
      setMessage(`WBS saved (${result?.rowsSaved || payloadRows.length} rows).`);
      await loadPlannerState(selectedModelId);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save WBS."));
    } finally {
      setSaving(false);
    }
  }, [projectId, selectedModelId, wbsRows, invalidRowsCount, sourceFileName, loadPlannerState]);

  const runMatching = useCallback(async () => {
    if (!projectId || !selectedModelId) return;
    try {
      setRunningMatch(true);
      setError(null);
      const result = await AecService.runWbsMatch(projectId, {
        modelId: selectedModelId,
        wbsSetId: wbsSetId || undefined,
      });
      setMessage(`Matching completed: ${result?.matchedElements || 0}/${result?.totalElements || 0}`);
      await loadPlannerState(selectedModelId);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to run matching."));
    } finally {
      setRunningMatch(false);
    }
  }, [projectId, selectedModelId, wbsSetId, loadPlannerState]);

  const isolateMatchRow = useCallback(async (row: MatchRow) => {
    try {
      setResolvingIsolation(true);
      const ids = await resolveViewerDbIdsForRows([row]);
      if (!ids.length) {
        setMessage("No visible dbId was found for this element.");
        return;
      }
      isolateViewerDbIds(ids);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to isolate element."));
    } finally {
      setResolvingIsolation(false);
    }
  }, []);

  const importWbsFromExcel = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = loadEvent.target?.result;
        if (!data) throw new Error("The file has no readable content.");

        const workbook = XLSX.read(data, { type: "array" });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as unknown[][];

        const parsedRows = matrix
          .slice(1)
          .map((row) => {
            const code = pickDeepestCodeFromLevels(row);
            const title = toText(row?.[4]);
            if (!isValidWbsCode(code) || !title) return null;
            return createLocalWbsRow({
              code,
              title,
              plannedStartDate: parseDateToIso(row?.[5]),
              plannedEndDate: parseDateToIso(row?.[6]),
              actualStartDate: parseDateToIso(row?.[7]),
              actualEndDate: parseDateToIso(row?.[8]),
              plannedCost: toText(row?.[9]),
              duration: toText(row?.[10]),
            });
          })
          .filter(Boolean) as WbsEditableRow[];

        const dedup = Array.from(
          new Map(parsedRows.map((row) => [normalizeWbsCode(row.code), row])).values()
        ).sort((a, b) => compareWbsCodes(a.code, b.code));

        setWbsRows(dedup);
        setSourceFileName(file.name);
        setMessage(`WBS imported: ${dedup.length} valid rows.`);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to import the WBS file."));
      } finally {
        if (inputFileRef.current) inputFileRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (!selectedModelId) return;
    sessionStorage.setItem(selectionStorageKey, selectedModelId);
    loadPlannerState(selectedModelId);
  }, [selectedModelId, selectionStorageKey, loadPlannerState]);

  useEffect(() => {
    if (!selectedModelUrn) return;
    simpleViewer(selectedModelUrn, "TADAecWbsViewer").catch((err) => {
      setError(getErrorMessage(err, "Failed to load the WBS viewer."));
    });
    return () => {
      teardownSimpleViewer();
    };
  }, [selectedModelUrn]);

  useEffect(() => {
    if (!playbackDates.length) {
      setTimelineIndex(0);
      setPlaybackDate("");
      clearViewerIsolation();
      return;
    }
    const safeIndex = Math.min(timelineIndex, playbackDates.length - 1);
    applyFrame(safeIndex).catch(() => {});
  }, [timelineIndex, playbackDates, applyFrame]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Project 4D WBS Planner</h1>
          <p className="text-sm text-slate-500">
            WBS planning, Assembly Code matching, and timeline-based 4D review ({platform.toUpperCase()}).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => inputFileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            Import XLSX
          </Button>
          <Button variant="outline" onClick={saveWbs} disabled={saving || !wbsRows.length} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save WBS"}
          </Button>
          <Button onClick={runMatching} disabled={runningMatch || !selectedModelId} className="gap-2">
            <Link2 className="h-4 w-4" />
            {runningMatch ? "Matching..." : "Run Matching"}
          </Button>
        </div>
      </header>

      <input ref={inputFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importWbsFromExcel} />

      {error ? (
        <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}
      {message ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-3 rounded-lg border bg-white p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">AEC Model</label>
          <select
            className="w-full rounded border px-3 py-2 text-sm"
            value={selectedModelId}
            onChange={(event) => {
              const modelId = event.target.value;
              const model = models.find((item) => String(item.id) === String(modelId));
              setSelectedModelId(modelId);
              setSelectedModelUrn(String(model?.urn || ""));
              setWbsRows([]);
              setMatchRows([]);
              setTimelineIndex(0);
              setPlaybackDate("");
            }}
            disabled={loadingModels}
          >
            <option value="">{loadingModels ? "Loading models..." : "Select a model"}</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name || model.id}
              </option>
            ))}
          </select>

          <div className="rounded border bg-slate-50 p-3 text-sm">
            <p>WBS Set: {wbsSetId || "-"}</p>
            <p>Source: {sourceFileName || "-"}</p>
            <p>Rows: {wbsRows.length}</p>
            <p className={invalidRowsCount > 0 ? "text-red-600" : ""}>Invalid Rows: {invalidRowsCount}</p>
          </div>

          <div className="rounded border bg-slate-50 p-3 text-sm">
            <p>Total: {matchSummary.totalElements}</p>
            <p>Matched: {matchSummary.matchedElements}</p>
            <p>Unmatched: {matchSummary.unmatchedElements}</p>
            <p>Average Confidence: {(matchSummary.averageConfidence * 100).toFixed(1)}%</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => clearViewerIsolation()}>
              Clear Isolation
            </Button>
          </div>
          <p className="text-xs text-slate-500">Frame Date: {playbackDate || "-"}</p>
        </aside>

        <main className="space-y-4">
          <div className="rounded-lg border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Viewer</h2>
              {loadingState || resolvingIsolation ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {loadingState ? "Loading state..." : "Resolving dbIds..."}
                </span>
              ) : null}
            </div>
            <div id="TADAecWbsViewer" className="relative h-[360px] w-full overflow-hidden rounded border bg-slate-100" />

            <div className="mt-4 rounded border bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">4D Timeline</h3>
                <span className="text-xs text-slate-500">
                  {playbackDates.length ? `${timelineIndex + 1}/${playbackDates.length}` : "0/0"}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(playbackDates.length - 1, 0)}
                step={1}
                value={Math.min(timelineIndex, Math.max(playbackDates.length - 1, 0))}
                onChange={(event) => setTimelineIndex(Number(event.target.value) || 0)}
                disabled={!playbackDates.length || !matchRows.length}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
              />
              <p className="mt-2 text-xs text-slate-600">
                Current Date: {playbackDate || "No planned dates available"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">WBS Editable ({wbsRows.length})</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWbsRows((prev) => [...prev, createLocalWbsRow({ code: "", title: "" })])}
              >
                Add Row
              </Button>
            </div>
            <div className="max-h-[220px] overflow-auto">
              <table className="w-full min-w-[1160px] text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left">Code</th>
                    <th className="px-2 py-2 text-left">Title</th>
                    <th className="px-2 py-2 text-left">Planned Start Date</th>
                    <th className="px-2 py-2 text-left">Planned End Date</th>
                    <th className="px-2 py-2 text-left">Real Start Date</th>
                    <th className="px-2 py-2 text-left">Real End Date</th>
                    <th className="px-2 py-2 text-left">Cost</th>
                    <th className="px-2 py-2 text-left">L1-L4</th>
                    <th className="px-2 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wbsRows.map((row, index) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-2 py-1">
                        <input
                          className={`w-24 rounded border px-2 py-1 ${
                            row.code && !isValidWbsCode(row.code) ? "border-red-400" : ""
                          }`}
                          value={row.code}
                          onChange={(event) =>
                            setWbsRows((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, code: normalizeWbsCode(event.target.value) } : item
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="w-44 rounded border px-2 py-1"
                          value={row.title}
                          onChange={(event) =>
                            setWbsRows((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, title: event.target.value } : item))
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="date"
                          className="w-36 rounded border px-2 py-1"
                          value={row.plannedStartDate}
                          onChange={(event) =>
                            setWbsRows((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, plannedStartDate: event.target.value } : item
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="date"
                          className="w-36 rounded border px-2 py-1"
                          value={row.plannedEndDate}
                          onChange={(event) =>
                            setWbsRows((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, plannedEndDate: event.target.value } : item
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="date"
                          className="w-36 rounded border px-2 py-1"
                          value={row.actualStartDate}
                          onChange={(event) =>
                            setWbsRows((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, actualStartDate: event.target.value } : item
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="date"
                          className="w-36 rounded border px-2 py-1"
                          value={row.actualEndDate}
                          onChange={(event) =>
                            setWbsRows((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, actualEndDate: event.target.value } : item
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="w-20 rounded border px-2 py-1"
                          value={row.plannedCost}
                          onChange={(event) =>
                            setWbsRows((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, plannedCost: event.target.value } : item))
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1 text-[11px] text-slate-500">
                        {[1, 2, 3, 4].map((level) => getCodeAtLevel(row.code, level) || "-").join(" / ")}
                      </td>
                      <td className="px-2 py-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setWbsRows((prev) => prev.filter((item) => item.id !== row.id))}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {wbsRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-8 text-center text-slate-500">
                        No WBS rows loaded. Import a file or add rows manually.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-3">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Matching Results ({matchRows.length})</h2>
            <div className="max-h-[220px] overflow-auto">
              <table className="w-full min-w-[760px] text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left">Assembly</th>
                    <th className="px-2 py-2 text-left">Element</th>
                    <th className="px-2 py-2 text-left">WBS</th>
                    <th className="px-2 py-2 text-left">Strategy</th>
                    <th className="px-2 py-2 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {matchRows.map((row, index) => (
                    <tr
                      key={`${row.elementId || row.dbId || index}-${index}`}
                      className="cursor-pointer border-t hover:bg-slate-50"
                      onClick={() => isolateMatchRow(row)}
                    >
                      <td className="px-2 py-2">{row.assemblyCode || "-"}</td>
                      <td className="px-2 py-2">{row.elementName || "-"}</td>
                      <td className="px-2 py-2">
                        {row.matchedWbsCode || "-"} {row.matchedWbsTitle ? `| ${row.matchedWbsTitle}` : ""}
                      </td>
                      <td className="px-2 py-2">{row.strategy || "-"}</td>
                      <td className="px-2 py-2 text-right">{((Number(row.confidence) || 0) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  {matchRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-8 text-center text-slate-500">
                        Run matching to display linked elements.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
