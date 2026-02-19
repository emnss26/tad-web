import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProjectPlansService } from "@/services/project.plans.service";
import { DmService } from "@/services/dm.service";
import { PlansTable } from "@/components/plans/plans-table";
import { PlansPieChart } from "@/components/plans/plans-pie-chart";
import { PlansFolderMappingModal } from "@/components/plans/plans-folder-mapping-modal";
import type { PlanCount, PlanRow } from "@/components/plans/plans.types";
import type { DmFolderNode } from "@/services/dm.service";

interface ProjectPlansPageProps {
  platform: "acc" | "bim360";
}

interface ApiPlanPayload {
  _key?: string;
  Id?: string;
  SheetName?: string;
  SheetNumber?: string;
  Discipline?: string;
  Revision?: string;
  LastModifiedDate?: string;
  InFolder?: boolean;
  InARevisionProcess?: string;
  RevisionStatus?: string;
}

interface DmFileDataPayload {
  itemId?: string;
  data?: {
    id?: string;
    attributes?: {
      lastModifiedTime?: string;
    };
  };
}

interface DmFileRevisionPayload {
  itemId?: string;
  label?: string;
  reviewStatus?: string;
  status?: string;
}

interface ExcelPlanRow {
  id?: string | number;
  Id?: string | number;
  SheetName?: string;
  SheetNumber?: string;
  Discipline?: string;
  Revision?: string | number | null;
  RevisionDate?: string | Date;
  exists?: boolean;
  InFolder?: boolean;
  revisionProcess?: string;
  InARevisionProcess?: string;
  revisionStatus?: string;
  RevisionStatus?: string;
}

const defaultPlanRow: PlanRow = {
  id: "",
  SheetName: "",
  SheetNumber: "",
  Discipline: "",
  Revision: "",
  lastModifiedTime: "",
  exists: false,
  revisionProcess: "",
  revisionStatus: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function normalizePlanFromApi(raw: ApiPlanPayload, index: number): PlanRow {
  const id = String(raw?._key || raw?.Id || `plan-${Date.now()}-${index}`);
  return {
    id,
    SheetName: String(raw?.SheetName || ""),
    SheetNumber: String(raw?.SheetNumber || ""),
    Discipline: String(raw?.Discipline || "Unassigned"),
    Revision: String(raw?.Revision || ""),
    lastModifiedTime: String(raw?.LastModifiedDate || "").split("T")[0] || "",
    exists: Boolean(raw?.InFolder),
    revisionProcess: String(raw?.InARevisionProcess || ""),
    revisionStatus: String(raw?.RevisionStatus || ""),
  };
}

function parseExcelDate(rawDate: unknown): string {
  if (typeof rawDate === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
    const [day, month, year] = rawDate.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    return rawDate.toISOString().split("T")[0];
  }

  return "";
}

function findNodeById(nodes: DmFolderNode[], nodeId: string): DmFolderNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

function flattenFiles(nodes: DmFolderNode[]): Array<{ itemId: string; versionUrn: string; name: string }> {
  let output: Array<{ itemId: string; versionUrn: string; name: string }> = [];
  nodes.forEach((node) => {
    if (node.type === "file") {
      output.push({
        itemId: node.id,
        versionUrn: String(node.version_urn || ""),
        name: node.name || "",
      });
    }

    if (node.children?.length) {
      output = output.concat(flattenFiles(node.children));
    }
  });
  return output;
}

export default function ProjectPlansPage({ platform }: ProjectPlansPageProps) {
  const { projectId, accountId } = useParams<{ projectId: string; accountId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [mappedPlans, setMappedPlans] = useState<PlanRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [tableFilter, setTableFilter] = useState<{ discipline: string | null; revision: string | null }>({
    discipline: null,
    revision: null,
  });

  const [showMapping, setShowMapping] = useState(false);

  const fetchPlansData = useCallback(async () => {
    if (!projectId || !accountId) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const response = await ProjectPlansService.getPlans(projectId, accountId);
      const normalized = Array.isArray(response)
        ? response.map((item) => item as ApiPlanPayload).map((item, index) => normalizePlanFromApi(item, index))
        : [];

      setPlans(normalized);
      setMappedPlans([]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error loading plans data."));
      setPlans([]);
      setMappedPlans([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, accountId]);

  useEffect(() => {
    fetchPlansData();
  }, [fetchPlansData]);

  const disciplineCounts: PlanCount[] = useMemo(() => {
    const counts: Record<string, number> = {};
    plans.forEach((plan) => {
      const key = plan.Discipline || "Unassigned";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([id, value]) => ({ id, value }));
  }, [plans]);

  const revisionCounts: PlanCount[] = useMemo(() => {
    const counts: Record<string, number> = {};
    plans.forEach((plan) => {
      const key = plan.Revision || "N/A";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([id, value]) => ({ id, value }));
  }, [plans]);

  const filteredPlansForTable = useMemo(() => {
    let source = mappedPlans.length > 0 ? mappedPlans : plans;

    if (tableFilter.discipline) {
      source = source.filter((plan) => (plan.Discipline || "Unassigned") === tableFilter.discipline);
    }

    if (tableFilter.revision) {
      source = source.filter((plan) => (plan.Revision || "N/A") === tableFilter.revision);
    }

    return source;
  }, [plans, mappedPlans, tableFilter]);

  const handleSubmit = async () => {
    if (!projectId || !accountId) return;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const validPlans = plans.filter((plan) => plan.SheetNumber || plan.SheetName);
      if (!validPlans.length) {
        setError("No valid plan data to send.");
        return;
      }

      const saved = await ProjectPlansService.savePlans(projectId, accountId, validPlans);
      const normalized = Array.isArray(saved)
        ? saved.map((item) => item as ApiPlanPayload).map((item, index) => normalizePlanFromApi(item, index))
        : [];

      if (normalized.length) {
        setPlans(normalized);
        setMappedPlans([]);
      }

      setMessage("Plan data sent successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error saving plans."));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (planId: string, field: keyof PlanRow, value: string) => {
    setPlans((previous) =>
      previous.map((plan) => (plan.id === planId ? { ...plan, [field]: value, isPlaceholder: false } : plan))
    );
  };

  const handleAddRow = () => {
    const id = Date.now().toString();
    setPlans((previous) => [
      ...previous,
      {
        ...defaultPlanRow,
        id,
      },
    ]);
  };

  const handleRemoveRows = async (ids: string[]) => {
    if (!projectId || !accountId || ids.length === 0) return;

    try {
      setError(null);
      await ProjectPlansService.deletePlans(projectId, accountId, ids);
      setPlans((previous) => previous.filter((plan) => !ids.includes(plan.id)));
      setMappedPlans((previous) => previous.filter((plan) => !ids.includes(plan.id)));
      setSelectedRows([]);
      setMessage(`Removed ${ids.length} plans.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error deleting plans."));
    }
  };

  const handleFolderChosen = async (folderId: string, tree: DmFolderNode[]) => {
    if (!projectId || !accountId) return;

    const root = findNodeById(tree, folderId);
    if (!root) return;

    const files = flattenFiles(root.children || []);
    const lineageIds = files.map((item) => item.itemId);
    const versionUrns = files.map((item) => item.versionUrn).filter(Boolean);

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const [details, revisions] = await Promise.all([
        lineageIds.length > 0 ? DmService.getFileData(projectId, accountId, lineageIds) : Promise.resolve([]),
        versionUrns.length > 0 ? DmService.getFileRevisions(projectId, accountId, versionUrns) : Promise.resolve([]),
      ]);

      const typedDetails = details as DmFileDataPayload[];
      const typedRevisions = revisions as DmFileRevisionPayload[];

      const updatedPlans = plans.map((plan) => {
        const matchNode = files.find((file) =>
          file.name.toLowerCase().includes((plan.SheetNumber || "").toLowerCase())
        );

        const exists = Boolean(matchNode);
        const lineageId = matchNode?.itemId;
        const versionUrn = matchNode?.versionUrn;

        const detailMatch = typedDetails.find(
          (entry) => entry?.itemId === lineageId || entry?.data?.id === lineageId
        );
        const rawTimestamp = detailMatch?.data?.attributes?.lastModifiedTime;
        const lastModifiedTime = rawTimestamp ? String(rawTimestamp).split("T")[0] : "";

        const revisionMatch =
          typedRevisions.find((entry) => entry?.itemId === versionUrn) || {};

        return {
          ...plan,
          exists,
          lastModifiedTime,
          revisionProcess: String(revisionMatch?.label || ""),
          revisionStatus: String(revisionMatch?.reviewStatus || revisionMatch?.status || ""),
        };
      });

      setMappedPlans(updatedPlans);
      setPlans(updatedPlans);
      setMessage("Folder mapping applied.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error mapping folder data."));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPlans = () => {
    if (!projectId) return;

    const worksheet = XLSX.utils.json_to_sheet(plans);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plans");
    XLSX.writeFile(workbook, `project-${projectId}-plans.xlsx`);
  };

  const handleImportPlans = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const data = loadEvent.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "binary" });
      const firstSheet = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<ExcelPlanRow>(workbook.Sheets[firstSheet], { defval: "" });

      const importedPlans: PlanRow[] = rows.map((row, index) => ({
        id: String(row.id ?? row.Id ?? `import-${Date.now()}-${index}`),
        SheetName: String(row.SheetName || ""),
        SheetNumber: String(row.SheetNumber || ""),
        Discipline: String(row.Discipline || ""),
        Revision:
          row.Revision !== null && row.Revision !== undefined
            ? String(row.Revision)
            : "",
        lastModifiedTime: parseExcelDate(row.RevisionDate),
        exists: Boolean(row.exists || row.InFolder),
        revisionProcess: String(row.revisionProcess || row.InARevisionProcess || ""),
        revisionStatus: String(row.revisionStatus || row.RevisionStatus || ""),
      }));

      setPlans(importedPlans);
      setMappedPlans([]);
      setMessage(`Imported ${importedPlans.length} rows from Excel.`);
    };

    reader.readAsBinaryString(file);
    event.target.value = "";
  }, []);

  return (
    <div className="flex min-h-full">
      <main className="w-full min-w-0 bg-white p-2 px-4">
        <h1 className="mt-2 text-right text-xl">PROJECT PLANS MANAGEMENT ({platform.toUpperCase()})</h1>
        <hr className="my-4 border-t border-gray-300" />

        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => setShowMapping(true)}>
            Files - Folder mapping
          </Button>
          <Button variant="outline" onClick={fetchPlansData} disabled={loading}>
            Pull Data
          </Button>
          <Button onClick={handleSubmit} disabled={saving || loading}>
            {saving ? "Sending..." : "Send Data"}
          </Button>
          <Button variant="outline" onClick={() => setTableFilter({ discipline: null, revision: null })}>
            Reset Chart Filter
          </Button>
          <Button variant="outline" onClick={handleExportPlans}>
            Export Plans List
          </Button>
          <label className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportPlans}
              className="hidden"
            />
          </label>
        </div>

        {loading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading plans...
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-4">
            <AlertTitle>Status</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-1">
            <PlansPieChart
              title="Plans by Discipline"
              data={disciplineCounts}
              onSliceClick={(value) =>
                setTableFilter((previous) => ({ ...previous, discipline: value || null }))
              }
            />
            <PlansPieChart
              title="Plans by Revision"
              data={revisionCounts}
              onSliceClick={(value) =>
                setTableFilter((previous) => ({ ...previous, revision: value || null }))
              }
            />
          </section>

          <section className="lg:col-span-2">
            <PlansTable
              plans={filteredPlansForTable}
              onInputChange={handleInputChange}
              onAddRow={handleAddRow}
              onRemoveRows={handleRemoveRows}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
            />
          </section>
        </div>
      </main>

      <PlansFolderMappingModal
        open={showMapping}
        onClose={() => setShowMapping(false)}
        accountId={accountId || ""}
        projectId={projectId || ""}
        onFolderChosen={handleFolderChosen}
      />
    </div>
  );
}
