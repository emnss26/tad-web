import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DmService } from "@/services/dm.service";
import { vrSimpleViewer } from "@/utils/viewers/vr.simple.viewer";

interface ProjectVrPageProps {
  platform: "acc" | "bim360";
}

export default function ProjectVrPage({ platform }: ProjectVrPageProps) {
  const { projectId, accountId } = useParams<{ projectId: string; accountId: string }>();

  const [federatedModelUrn, setFederatedModelUrn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGlb, setLoadingGlb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertStatus, setConvertStatus] = useState("Waiting for conversion...");
  const [convertedSourceType, setConvertedSourceType] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !accountId) return;

    const loadFederatedModel = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await DmService.getFederatedModel(projectId, accountId);
        setFederatedModelUrn(result?.federatedmodel || null);
      } catch (err: any) {
        console.error("[ProjectVrPage.loadFederatedModel]", err);
        setError(err?.message || "Error loading federated model.");
      } finally {
        setLoading(false);
      }
    };

    loadFederatedModel();
  }, [accountId, projectId]);

  useEffect(() => {
    if (!federatedModelUrn) return;

    vrSimpleViewer(federatedModelUrn).catch((err) => {
      console.error("[ProjectVrPage.viewer]", err);
      setError(err?.message || "Error loading VR viewer.");
    });
  }, [federatedModelUrn]);

  const convertedIsGlb = useMemo(() => {
    if (!convertedUrl) return false;
    return /\.glb($|\?)/i.test(convertedUrl) || /\.gltf($|\?)/i.test(convertedUrl);
  }, [convertedUrl]);

  const handleGetGlb = async () => {
    if (!projectId || !accountId) return;

    try {
      setLoadingGlb(true);
      setError(null);
      setConvertStatus("Converting IFC model to GLB...");

      const result = await DmService.getFederatedGlbUrl(projectId, accountId);
      setConvertedUrl(result?.glbUrl || null);
      setConvertedSourceType(result?.sourceType || null);

      if (result?.glbUrl) {
        setConvertStatus("Conversion completed.");
      } else {
        setConvertStatus("Unable to get conversion URL.");
      }
    } catch (err: any) {
      console.error("[ProjectVrPage.handleGetGlb]", err);
      setError(err?.message || "Error converting IFC model.");
      setConvertStatus("Conversion failed.");
    } finally {
      setLoadingGlb(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mt-2 text-right text-xl text-black">VR VIEWER ({platform.toUpperCase()})</h1>
      <hr className="my-4 border-t border-gray-300" />

      {error && <p className="mb-2 text-sm text-red-500">Error loading model: {error}</p>}

      <div className="mb-3 flex items-center gap-3">
        <Button onClick={handleGetGlb} disabled={!federatedModelUrn || loadingGlb || loading}>
          {loadingGlb ? "Converting..." : "Convert IFC to GLB + VR"}
        </Button>
        <span className="text-sm text-muted-foreground">{convertStatus}</span>
      </div>

      <div className="flex-1">
        <div className="flex w-full min-w-0 space-x-4">
          <div className="flex h-[550px] w-full flex-col rounded bg-white p-4 shadow">
            <h2 className="mb-1 text-lg font-semibold">Project Federated Model Viewer</h2>
            <hr className="my-4 border-t border-gray-300" />

            {loading ? (
              <div className="flex h-[450px] items-center justify-center text-sm text-muted-foreground">
                Loading viewer...
              </div>
            ) : (
              <div id="TADSimpleVrViwer" className="relative h-[450px] w-full flex-1 rounded border" />
            )}
          </div>
        </div>

        {convertedUrl && (
          <div className="mt-4 rounded bg-white p-4 shadow">
            <h3 className="mb-1 text-lg font-semibold">VR Conversion Output</h3>
            <p className="mb-2 text-sm text-muted-foreground">
              {convertedIsGlb
                ? "GLB file generated. Open it in your preferred WebXR viewer."
                : "Received source URL for federated IFC file. Local IFC->GLB conversion is not enabled in backend."}
            </p>
            <a
              href={convertedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-blue-600 underline"
            >
              Open converted file URL
            </a>
            {convertedSourceType && <p className="mt-2 text-xs text-muted-foreground">Source type: {convertedSourceType}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
