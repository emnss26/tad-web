import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ModulePageHeader from "@/components/hub/ModulePageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Box, CheckCircle2, Loader2 } from "lucide-react";
import { DmService } from "@/services/dm.service";
import { ModelCheckerService } from "@/services/model.checker.service";
import type { LodCheckerApiRow, LodProjectComplianceResponse } from "@/services/model.checker.service";
import { StatCard } from "@/components/users/stat-card";
import { DisciplineSidebar } from "@/components/lod-checker/discipline-sidebar";
import { LodCheckerTable } from "@/components/lod-checker/lod-checker-table";
import { DISCIPLINES } from "@/components/lod-checker/lod-checker.types";
import type { LodCheckerRow } from "@/components/lod-checker/lod-checker.types";
import {
  apiRowsToUiRows,
  formatGeometryStatus,
  makeDefaultRows,
} from "@/components/lod-checker/lod-checker.utils";
import { modelCheckerViewer } from "@/utils/viewers/model.checker.viewer";

interface IModelFile {
  id: string;
  name: string;
  folderName: string;
  extension: string;
  urn: string;
  versionNumber?: number;
}

interface ProjectLodCheckerPageProps {
  platform: "acc" | "bim360";
}

export default function ProjectLodCheckerPage({ platform }: ProjectLodCheckerPageProps) {
  const { projectId, accountId } = useParams<{ projectId: string; accountId: string }>();

  const [discipline, setDiscipline] = useState<string>(DISCIPLINES[0]);
  const [rows, setRows] = useState<LodCheckerRow[]>(makeDefaultRows(DISCIPLINES[0]));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [projectCompliance, setProjectCompliance] = useState<LodProjectComplianceResponse | null>(null);

  const [federatedModel, setFederatedModel] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModelUrn, setSelectedModelUrn] = useState<string | null>(null);

  const [showMapping, setShowMapping] = useState(false);
  const [models, setModels] = useState<IModelFile[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const urnToLoad = useMemo(() => selectedModelUrn || federatedModel, [selectedModelUrn, federatedModel]);
  const complianceLoading = Boolean(selectedModelId) && !projectCompliance && !error;
  const overallCompliance = projectCompliance?.totals.overall ?? 0;
  const geometryCompliance = projectCompliance?.totals.geometry.percentage ?? 0;
  const lodCompliance = projectCompliance?.totals.lod.percentage ?? 0;

  useEffect(() => {
    if (!projectId || !accountId) return;

    const loadFederatedModel = async () => {
      try {
        setLoading(true);
        setError(null);

        const federated = await DmService.getFederatedModel(projectId, accountId);
        setFederatedModel(federated?.federatedmodel || null);
      } catch (err: any) {
        setError(err?.message || "Error loading federated model.");
      } finally {
        setLoading(false);
      }
    };

    loadFederatedModel();
  }, [accountId, projectId]);

  useEffect(() => {
    if (!projectId || !accountId || !discipline) return;

    const loadDisciplineRows = async () => {
      if (!selectedModelId) {
        setRows(makeDefaultRows(discipline));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setMessage(null);

        const fetchedRows = await ModelCheckerService.getRowsByDiscipline(
          projectId,
          accountId,
          discipline,
          selectedModelId
        );
        setRows(apiRowsToUiRows(fetchedRows, discipline));
      } catch (err: any) {
        console.error("[ProjectLodCheckerPage.loadDisciplineRows]", err);
        setRows(makeDefaultRows(discipline));
      } finally {
        setLoading(false);
      }
    };

    loadDisciplineRows();
  }, [accountId, discipline, projectId, selectedModelId]);

  useEffect(() => {
    if (!urnToLoad) return;

    modelCheckerViewer(urnToLoad).catch((err) => {
      console.error("[ProjectLodCheckerPage.viewer]", err);
      setError(err?.message || "Error loading Autodesk viewer.");
    });
  }, [urnToLoad]);

  const fetchModels = async () => {
    if (!projectId || !accountId) return;

    try {
      setLoadingModels(true);
      const result = await DmService.getProjectModels(projectId, accountId);
      setModels(result?.data || []);
    } catch (err: any) {
      setError(err?.message || "Error loading project models.");
    } finally {
      setLoadingModels(false);
    }
  };

  const loadProjectCompliance = async () => {
    if (!projectId || !accountId || !selectedModelId) {
      setProjectCompliance(null);
      return;
    }

    try {
      const summary = await ModelCheckerService.getProjectCompliance(projectId, accountId, selectedModelId);
      setProjectCompliance(summary);
    } catch {
      setProjectCompliance(null);
    }
  };

  useEffect(() => {
    loadProjectCompliance();
  }, [accountId, projectId, selectedModelId]);

  const handleSaveRows = async () => {
    if (!projectId || !accountId) return;
    if (!selectedModelId) {
      setError("Select a model before saving LOD checker rows.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload: LodCheckerApiRow[] = rows.map((row) => ({
        discipline,
        row: row.row,
        concept: row.concepto,
        req_lod: String(row.lodRequerido),
        complet_geometry: formatGeometryStatus(row.geometriaCompleta),
        lod_compliance: formatGeometryStatus(row.lodCompletion),
        comments: row.comentarios || "",
      }));

      await ModelCheckerService.saveRowsBulk(projectId, accountId, selectedModelId, payload);
      await loadProjectCompliance();

      setMessage(`Saved ${rows.length} rows for ${discipline}.`);
    } catch (err: any) {
      console.error("[ProjectLodCheckerPage.handleSaveRows]", err);
      setError(err?.message || "Error saving LOD checker rows.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <main className="min-w-0 bg-white p-2 px-4">
        <ModulePageHeader
          title="LOD Checker"
          description={`Review LOD compliance and geometry status by discipline (${platform.toUpperCase()}).`}
          actions={
            <>
              <Button onClick={handleSaveRows} disabled={saving || loading || !selectedModelId}>
                {saving ? "Saving..." : "Send Data"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMapping(true);
                  fetchModels();
                }}
              >
                Model Selector
              </Button>
            </>
          }
          className="mt-2 mb-3"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {selectedModelId && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard
              title="Project LOD Compliance"
              value={`${overallCompliance}%`}
              icon={<BarChart3 className="h-5 w-5" />}
              loading={complianceLoading}
              variant="primary"
              description="Overall compliance"
            />
            <StatCard
              title="Geometry Compliance"
              value={`${geometryCompliance}%`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              loading={complianceLoading}
              variant="success"
              description="Y over valid geometry checks"
            />
            <StatCard
              title="LOD Compliance"
              value={`${lodCompliance}%`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              loading={complianceLoading}
              variant="warning"
              description="Y over valid LOD checks"
            />
          </div>
        )}
      </main>

      <Dialog open={showMapping} onOpenChange={setShowMapping}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Select ACC / BIM360 Model</DialogTitle>
          </DialogHeader>

          {loadingModels ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="mb-2 h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading models...</p>
            </div>
          ) : (
            <ScrollArea className="h-[320px] pr-4">
              {models.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No models found in this project.</p>
              ) : (
                <div className="space-y-2">
                  {models.map((file) => (
                    <button
                      key={file.id}
                      className="group flex w-full items-center justify-between rounded-md border p-3 text-left transition hover:bg-accent"
                      onClick={() => {
                        setSelectedModelId(file.id);
                        setSelectedModelUrn(file.urn);
                        setShowMapping(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded bg-primary/10 p-2 text-primary">
                          <Box className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium group-hover:underline">{file.name}</span>
                          <span className="text-xs text-muted-foreground">Folder: {file.folderName}</span>
                        </div>
                      </div>

                      {file.versionNumber && (
                        <Badge variant="secondary" className="text-xs">
                          v{file.versionNumber}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 px-4 pb-4 xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="min-h-0 max-h-[750px]">
          <DisciplineSidebar
            selected={discipline}
            onSelect={(value) => {
              setDiscipline(value);
              setRows([]);
            }}
          />
        </div>

        <section className="min-h-[520px] max-h-[750px] overflow-auto rounded-md border bg-white p-4">
          <h2 className="mb-4 text-2xl font-bold">LOD Checker - {discipline}</h2>
          <LodCheckerTable discipline={discipline} rows={rows} onRowsChange={setRows} />
        </section>

        <div className="min-h-[520px] max-h-[750px] overflow-hidden rounded-md border bg-gray-50 p-4">
          <div className="flex h-full flex-col">
            <div id="TADModelCheckerViwer" className="relative min-h-[420px] flex-1 rounded border bg-white" />

            {!urnToLoad && !loading && (
              <p className="mt-2 text-sm text-muted-foreground">No model selected. Use "Model Selector" to select a model.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
