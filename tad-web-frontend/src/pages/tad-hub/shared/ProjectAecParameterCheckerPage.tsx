import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AecService, type AecElementRow, type AecModel } from "@/services/aec.service";
import { AEC_DISCIPLINES, getDisciplineById } from "@/constants/aec-parameter-checker.constants";
import {
  clearViewerIsolation,
  isolateViewerDbIds,
  resolveViewerDbIdsForRows,
  simpleViewer,
  teardownSimpleViewer,
} from "@/utils/viewers/aec.simple.viewer";

interface ProjectAecParameterCheckerPageProps {
  platform: "acc" | "bim360";
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

interface CategorySummary {
  totalElements: number;
  averageCompliancePct: number;
  fullyCompliant: number;
}

interface LocalRow extends AecElementRow {
  analysisCategoryId?: string;
  analysisCategoryName?: string;
  analysisCategoryQuery?: string;
}

interface ProjectComplianceRow {
  modelId: string;
  modelName?: string;
  totalElements: number;
  modelCompliancePct: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as HttpErrorLike).response;
    const message = response?.data?.message || response?.data?.error;
    if (typeof message === "string" && message.trim()) return message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as HttpErrorLike).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
};

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getComplianceBadge = (pct: number) => {
  if (pct >= 100) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (pct >= 70) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
};

const summarizeRows = (rows: LocalRow[]): CategorySummary => {
  const totalElements = rows.length;
  if (!totalElements) {
    return {
      totalElements: 0,
      averageCompliancePct: 0,
      fullyCompliant: 0,
    };
  }

  const pcts = rows.map((row) => Number(row?.compliance?.pct) || 0);
  const avg = Math.round(pcts.reduce((acc, value) => acc + value, 0) / totalElements);
  const fullyCompliant = pcts.filter((pct) => pct >= 100).length;

  return {
    totalElements,
    averageCompliancePct: avg,
    fullyCompliant,
  };
};

export default function ProjectAecParameterCheckerPage({ platform }: ProjectAecParameterCheckerPageProps) {
  const { projectId } = useParams<{ projectId: string }>();

  const [models, setModels] = useState<AecModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedModelUrn, setSelectedModelUrn] = useState("");

  const [selectedDisciplineId, setSelectedDisciplineId] = useState(AEC_DISCIPLINES[0].id);
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");

  const [allRows, setAllRows] = useState<LocalRow[]>([]);
  const [disciplineSummary, setDisciplineSummary] = useState<CategorySummary>({
    totalElements: 0,
    averageCompliancePct: 0,
    fullyCompliant: 0,
  });

  const [categorySummaries, setCategorySummaries] = useState<Record<string, CategorySummary>>({});
  const [projectComplianceRows, setProjectComplianceRows] = useState<ProjectComplianceRow[]>([]);

  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProjectSummary, setLoadingProjectSummary] = useState(false);
  const [resolvingIsolation, setResolvingIsolation] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedDiscipline = useMemo(() => getDisciplineById(selectedDisciplineId), [selectedDisciplineId]);

  const selectedModel = useMemo(
    () => models.find((model) => String(model.id) === String(selectedModelId)) || null,
    [models, selectedModelId]
  );

  const selectionStorageKey = useMemo(
    () => `tad_aec_parameter_checker_model_${projectId || "unknown"}`,
    [projectId]
  );

  const displayedRows = useMemo(() => {
    if (selectedCategoryId === "ALL") return allRows;
    const selectedCategory = selectedDiscipline.categories.find((category) => category.id === selectedCategoryId);
    if (!selectedCategory) return allRows;

    const categoryName = normalize(selectedCategory.name);
    const categoryQuery = normalize(selectedCategory.query);

    return allRows.filter((row) => {
      const analysisName = normalize(row.analysisCategoryName);
      const analysisQuery = normalize(row.analysisCategoryQuery);
      const elementCategory = normalize(row.category);
      return (
        analysisName === categoryName ||
        analysisQuery === categoryQuery ||
        elementCategory === categoryName ||
        elementCategory === categoryQuery
      );
    });
  }, [allRows, selectedCategoryId, selectedDiscipline.categories]);

  const displayedSummary = useMemo(() => summarizeRows(displayedRows), [displayedRows]);

  const loadProjectCompliance = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingProjectSummary(true);
      const payload = await AecService.getProjectCompliance(projectId);
      const rows = Array.isArray(payload?.rows) ? payload.rows : [];
      setProjectComplianceRows(
        rows.map((row: any) => ({
          modelId: String(row?.modelId || ""),
          modelName: String(row?.modelName || ""),
          totalElements: Number(row?.totalElements) || 0,
          modelCompliancePct: Number(row?.modelCompliancePct ?? row?.averageCompliancePct) || 0,
        }))
      );
    } finally {
      setLoadingProjectSummary(false);
    }
  }, [projectId]);

  const loadModels = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoadingModels(true);
      setError(null);
      const payload = await AecService.getModels(projectId);
      const modelRows = Array.isArray(payload?.models) ? payload.models : [];
      setModels(modelRows);

      const stored = sessionStorage.getItem(selectionStorageKey);
      const preselected =
        modelRows.find((model) => String(model.id) === String(stored)) ||
        modelRows.find((model) => Boolean(model.urn)) ||
        modelRows[0];

      if (preselected?.id) {
        setSelectedModelId(String(preselected.id));
        setSelectedModelUrn(String(preselected.urn || ""));
      } else {
        setSelectedModelId("");
        setSelectedModelUrn("");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load AEC models."));
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [projectId, selectionStorageKey]);

  const loadLastDiscipline = useCallback(async () => {
    if (!projectId || !selectedModelId) return;

    try {
      const response = await AecService.getLastDiscipline(projectId, selectedModelId);
      if (!response?.found) return;

      const disciplineId = String(response?.data?.disciplineId || "");
      const nextDiscipline = AEC_DISCIPLINES.find((item) => item.id === disciplineId);
      if (nextDiscipline) {
        setSelectedDisciplineId(nextDiscipline.id);
        setSelectedCategoryId("ALL");
      }
    } catch {}
  }, [projectId, selectedModelId]);

  const runDisciplineAnalysis = useCallback(async () => {
    if (!projectId || !selectedModelId) return;

    try {
      setAnalyzing(true);
      setError(null);
      setMessage(null);

      const summariesByCategory: Record<string, CategorySummary> = {};
      const aggregatedRows: LocalRow[] = [];
      const failedCategories: string[] = [];
      let successfulCategories = 0;

      for (const category of selectedDiscipline.categories) {
        try {
          const result = await AecService.getModelParametersByCategory(projectId, selectedModelId, category.query);
          const categoryRows = Array.isArray(result?.rows) ? result.rows : [];
          const normalizedRows: LocalRow[] = categoryRows.map((row) => ({
            ...row,
            analysisCategoryId: category.id,
            analysisCategoryName: category.name,
            analysisCategoryQuery: category.query,
          }));
          aggregatedRows.push(...normalizedRows);

          summariesByCategory[category.id] = {
            totalElements: Number(result?.summary?.totalElements) || 0,
            averageCompliancePct: Number(result?.summary?.averageCompliancePct) || 0,
            fullyCompliant: Number(result?.summary?.fullyCompliant) || 0,
          };
          successfulCategories += 1;
        } catch {
          failedCategories.push(category.name);
          summariesByCategory[category.id] = {
            totalElements: 0,
            averageCompliancePct: 0,
            fullyCompliant: 0,
          };
        }

        await delay(100);
      }

      if (successfulCategories === 0) {
        throw new Error("All category requests failed. Please retry the analysis.");
      }

      const categoriesAnalyzed = selectedDiscipline.categories.length || 1;
      const disciplineTotal = Object.values(summariesByCategory).reduce((acc, item) => acc + item.totalElements, 0);
      const disciplineFullyCompliant = Object.values(summariesByCategory).reduce(
        (acc, item) => acc + item.fullyCompliant,
        0
      );
      const disciplineCompliance = Math.round(
        Object.values(summariesByCategory).reduce((acc, item) => acc + item.averageCompliancePct, 0) /
          categoriesAnalyzed
      );

      setCategorySummaries(summariesByCategory);
      setAllRows(aggregatedRows);
      setDisciplineSummary({
        totalElements: disciplineTotal,
        fullyCompliant: disciplineFullyCompliant,
        averageCompliancePct: disciplineCompliance,
      });
      const baseMessage = `Discipline analysis completed. ${disciplineTotal} elements found across ${categoriesAnalyzed} categories.`;
      if (failedCategories.length > 0) {
        setMessage(`${baseMessage} Failed categories: ${failedCategories.join(", ")}.`);
      } else {
        setMessage(baseMessage);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to analyze the selected discipline."));
      setAllRows([]);
      setDisciplineSummary({
        totalElements: 0,
        averageCompliancePct: 0,
        fullyCompliant: 0,
      });
    } finally {
      setAnalyzing(false);
    }
  }, [projectId, selectedModelId, selectedDiscipline]);

  const loadLastCheck = useCallback(async () => {
    if (!projectId || !selectedModelId || !selectedDisciplineId) return;

    try {
      setLoadingHistory(true);
      setError(null);
      const response = await AecService.getLastParameterCheck(projectId, {
        modelId: selectedModelId,
        disciplineId: selectedDisciplineId,
      });

      if (!response?.found) {
        setMessage("No saved check found for the current model and discipline.");
        setAllRows([]);
        setCategorySummaries({});
        setDisciplineSummary({
          totalElements: 0,
          averageCompliancePct: 0,
          fullyCompliant: 0,
        });
        return;
      }

      const checkRows = Array.isArray(response?.data?.rows) ? response.data.rows : [];
      const normalizedRows: LocalRow[] = checkRows.map((row: LocalRow) => ({
        ...row,
        analysisCategoryId: String(row?.analysisCategoryId || ""),
        analysisCategoryName: String(row?.analysisCategoryName || ""),
        analysisCategoryQuery: String(row?.analysisCategoryQuery || ""),
      }));
      setAllRows(normalizedRows);

      const summary = {
        totalElements: Number(response?.data?.summary?.totalElements) || normalizedRows.length,
        averageCompliancePct: Number(response?.data?.summary?.averageCompliancePct) || 0,
        fullyCompliant: Number(response?.data?.summary?.fullyCompliant) || 0,
      };
      setDisciplineSummary(summary);

      const rebuiltCategorySummary: Record<string, CategorySummary> = {};
      selectedDiscipline.categories.forEach((category) => {
        const rows = normalizedRows.filter(
          (row) =>
            normalize(row.analysisCategoryId) === normalize(category.id) ||
            normalize(row.analysisCategoryQuery) === normalize(category.query) ||
            normalize(row.analysisCategoryName) === normalize(category.name)
        );
        rebuiltCategorySummary[category.id] = summarizeRows(rows);
      });
      setCategorySummaries(rebuiltCategorySummary);
      setMessage("Latest saved check loaded from DynamoDB.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load the latest saved check."));
    } finally {
      setLoadingHistory(false);
    }
  }, [projectId, selectedModelId, selectedDisciplineId, selectedDiscipline.categories]);

  const saveCurrentCheck = useCallback(async () => {
    if (!projectId || !selectedModelId || !selectedDisciplineId) return;
    if (!allRows.length) {
      setError("No analyzed rows available to save.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        modelId: selectedModelId,
        modelName: selectedModel?.name || "",
        disciplineId: selectedDisciplineId,
        categoryId: "ALL",
        rows: allRows,
        summary: disciplineSummary,
      };

      const result = await AecService.saveParameterCheck(projectId, payload);
      setMessage(`Check saved successfully (${result?.savedElements || allRows.length} elements).`);
      await loadProjectCompliance();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save parameter check."));
    } finally {
      setSaving(false);
    }
  }, [projectId, selectedModelId, selectedModel, selectedDisciplineId, allRows, disciplineSummary, loadProjectCompliance]);

  const isolateRow = useCallback(async (row: LocalRow) => {
    try {
      setResolvingIsolation(true);
      const ids = await resolveViewerDbIdsForRows([row]);
      if (!ids.length) {
        setMessage("No visible viewer dbId found for this element.");
        return;
      }
      isolateViewerDbIds(ids);
      setMessage(`Element isolated in viewer (dbIds: ${ids.join(", ")}).`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to isolate element in viewer."));
    } finally {
      setResolvingIsolation(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
    loadProjectCompliance();
  }, [loadModels, loadProjectCompliance]);

  useEffect(() => {
    if (!selectedModelId) return;
    sessionStorage.setItem(selectionStorageKey, selectedModelId);
    loadLastDiscipline();
  }, [selectedModelId, selectionStorageKey, loadLastDiscipline]);

  useEffect(() => {
    if (!selectedModelUrn) return;
    simpleViewer(selectedModelUrn, "TADAecSimpleViewer").catch((err) => {
      setError(getErrorMessage(err, "Failed to load Autodesk Viewer."));
    });
    return () => {
      teardownSimpleViewer();
    };
  }, [selectedModelUrn]);

  useEffect(() => {
    const validCategoryIds = new Set(selectedDiscipline.categories.map((category) => category.id));
    if (selectedCategoryId !== "ALL" && !validCategoryIds.has(selectedCategoryId)) {
      setSelectedCategoryId("ALL");
    }
  }, [selectedDiscipline, selectedCategoryId]);

  const selectedCategorySummary =
    selectedCategoryId === "ALL" ? displayedSummary : categorySummaries[selectedCategoryId] || displayedSummary;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Model Parameter Checker</h1>
          <p className="text-sm text-slate-500">
            Discipline-based analysis using AEC Model Data and DynamoDB ({platform.toUpperCase()}).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadLastCheck} disabled={!selectedModelId || loadingHistory}>
            {loadingHistory ? "Loading..." : "Load Latest Check"}
          </Button>
          <Button variant="outline" onClick={runDisciplineAnalysis} disabled={!selectedModelId || analyzing}>
            {analyzing ? "Analyzing..." : "Analyze Discipline"}
          </Button>
          <Button onClick={saveCurrentCheck} disabled={saving || !allRows.length}>
            {saving ? "Saving..." : "Save Check"}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4 rounded-lg border bg-white p-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">AEC Model</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={selectedModelId}
              onChange={(event) => {
                const modelId = event.target.value;
                const model = models.find((row) => String(row.id) === String(modelId));
                setSelectedModelId(modelId);
                setSelectedModelUrn(String(model?.urn || ""));
                setAllRows([]);
                setCategorySummaries({});
                setDisciplineSummary({
                  totalElements: 0,
                  averageCompliancePct: 0,
                  fullyCompliant: 0,
                });
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
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Discipline</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={selectedDisciplineId}
              onChange={(event) => {
                setSelectedDisciplineId(event.target.value);
                setSelectedCategoryId("ALL");
                setAllRows([]);
                setCategorySummaries({});
                setDisciplineSummary({
                  totalElements: 0,
                  averageCompliancePct: 0,
                  fullyCompliant: 0,
                });
              }}
            >
              {AEC_DISCIPLINES.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Category Filter</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
            >
              <option value="ALL">All Categories</option>
              {selectedDiscipline.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded border bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {selectedCategoryId === "ALL" ? "Discipline KPIs" : "Category KPIs"}
            </p>
            <p className="mt-1 text-sm text-slate-700">Elements: {selectedCategorySummary.totalElements}</p>
            <p className="text-sm text-slate-700">Compliance: {selectedCategorySummary.averageCompliancePct}%</p>
            <p className="text-sm text-slate-700">Fully Compliant: {selectedCategorySummary.fullyCompliant}</p>
          </div>

          <div className="space-y-2 rounded border bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-slate-500">Project Compliance</p>
              <Button variant="outline" size="sm" onClick={loadProjectCompliance} disabled={loadingProjectSummary}>
                {loadingProjectSummary ? "..." : "Refresh"}
              </Button>
            </div>
            <div className="max-h-48 overflow-auto">
              {!projectComplianceRows.length ? (
                <p className="text-xs text-slate-500">No compliance checks saved yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="text-left font-medium">Model</th>
                      <th className="text-right font-medium">Elements</th>
                      <th className="text-right font-medium">Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectComplianceRows.map((row, index) => (
                      <tr key={`${row.modelId}-${index}`} className="border-t">
                        <td className="py-1 pr-2">{row.modelName || row.modelId}</td>
                        <td className="py-1 pr-2 text-right">{row.totalElements}</td>
                        <td className="py-1 text-right">{row.modelCompliancePct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </aside>

        <main className="space-y-4">
          {error ? (
            <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}
          {message ? (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <div className="rounded-lg border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Viewer</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => clearViewerIsolation()}>
                  Clear Isolation
                </Button>
                {resolvingIsolation ? (
                  <Badge variant="secondary" className="gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Resolving dbIds
                  </Badge>
                ) : null}
              </div>
            </div>
            <div id="TADAecSimpleViewer" className="relative h-[420px] w-full overflow-hidden rounded border bg-slate-100" />
          </div>

          <div className="rounded-lg border bg-white">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Elements ({displayedRows.length}) - {selectedDiscipline.name}
                {selectedCategoryId !== "ALL"
                  ? ` / ${selectedDiscipline.categories.find((category) => category.id === selectedCategoryId)?.name || ""}`
                  : ""}
              </h2>
            </div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[980px] text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Category</th>
                    <th className="px-3 py-2 text-left font-medium">Assembly Code</th>
                    <th className="px-3 py-2 text-left font-medium">Assembly Description</th>
                    <th className="px-3 py-2 text-left font-medium">Element</th>
                    <th className="px-3 py-2 text-left font-medium">Family</th>
                    <th className="px-3 py-2 text-left font-medium">Manufacturer</th>
                    <th className="px-3 py-2 text-right font-medium">Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row, index) => {
                    const pct = Number(row?.compliance?.pct) || 0;
                    return (
                      <tr
                        key={`${row.elementId || row.dbId || index}-${index}`}
                        className="cursor-pointer border-t hover:bg-slate-50"
                        onClick={() => isolateRow(row)}
                      >
                        <td className="px-3 py-2">{row.analysisCategoryName || row.category || "-"}</td>
                        <td className="px-3 py-2">{row.assemblyCode || "-"}</td>
                        <td className="px-3 py-2">{row.assemblyDescription || "-"}</td>
                        <td className="px-3 py-2">{row.elementName || "-"}</td>
                        <td className="px-3 py-2">{row.familyName || "-"}</td>
                        <td className="px-3 py-2">{row.manufacturer || "-"}</td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold ${getComplianceBadge(
                              pct
                            )}`}
                          >
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                        Run analysis or load the latest check to display discipline elements.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}
