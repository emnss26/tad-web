/* global Autodesk */
/* eslint-disable @typescript-eslint/no-explicit-any */

const BACKEND_URL = import.meta.env.VITE_API_BACKEND_BASE_URL || "http://localhost:8080";

const VIEWER_STYLE_ID = "aps-viewer-style";
const VIEWER_SCRIPT_ID = "aps-viewer-script";
const ELEMENT_ID_PROP_FILTER = ["Revit Element ID", "Element Id", "ElementId", "Id"];
const ELEMENT_ID_PROP_NAMES = new Set(ELEMENT_ID_PROP_FILTER.map((name) => String(name).trim().toLowerCase()));
const BULK_PROPS_CHUNK_SIZE = 1000;

let viewerInstance: any = null;
let assetsPromise: Promise<void> | null = null;
let viewerElementIdIndex: Map<string, number> | null = null;
let viewerElementIdIndexPromise: Promise<Map<string, number>> | null = null;

const getAutodeskGlobal = () => {
  if (typeof window === "undefined") return null;
  return (window as any).Autodesk || null;
};

const loadStyleOnce = () => {
  if (document.getElementById(VIEWER_STYLE_ID)) return;

  const link = document.createElement("link");
  link.id = VIEWER_STYLE_ID;
  link.rel = "stylesheet";
  link.href = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css";
  document.head.appendChild(link);
};

const loadScriptOnce = () =>
  new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(VIEWER_SCRIPT_ID);
    if (existing) {
      if (getAutodeskGlobal()?.Viewing) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Autodesk Viewer script")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = VIEWER_SCRIPT_ID;
    script.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Autodesk Viewer script"));
    document.body.appendChild(script);
  });

const ensureViewerAssets = async () => {
  if (getAutodeskGlobal()?.Viewing) return;

  if (!assetsPromise) {
    assetsPromise = (async () => {
      loadStyleOnce();
      await loadScriptOnce();
    })();
  }

  await assetsPromise;
};

const normalizeBase64Url = (value: string) =>
  String(value || "")
    .trim()
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const isLikelyBase64 = (value: string) => /^[A-Za-z0-9_-]+$/.test(String(value || "").trim());

const toBase64Url = (value: string) => normalizeBase64Url(btoa(String(value || "")));

const toViewerDocumentId = (inputUrn: string) => {
  const value = String(inputUrn || "").trim();
  if (!value) return "";

  if (value.startsWith("urn:")) {
    const tail = value.slice(4).trim();
    if (tail && !tail.includes(":") && isLikelyBase64(tail)) {
      return `urn:${normalizeBase64Url(tail)}`;
    }
    return `urn:${toBase64Url(value)}`;
  }

  if (!value.includes(":") && isLikelyBase64(value)) {
    return `urn:${normalizeBase64Url(value)}`;
  }

  return `urn:${toBase64Url(`urn:${value}`)}`;
};

const fetchViewerToken = async (): Promise<string> => {
  const response = await fetch(`${BACKEND_URL}/api/auth/two-legged`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch viewer token (${response.status})`);
  }

  const json = await response.json();
  const token = json?.data?.access_token || json?.access_token || "";
  if (!token) throw new Error("Backend did not return viewer access token");
  return token;
};

const resetViewerElementIdIndex = () => {
  viewerElementIdIndex = null;
  viewerElementIdIndexPromise = null;
};

const parsePositiveDbId = (value: unknown): number | null => {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value <= 0) return null;
    return value;
  }

  const normalized = String(value || "").trim();
  if (!/^\d+$/.test(normalized)) return null;

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeElementIdKeys = (value: unknown): string[] => {
  const raw = String(value || "").trim();
  if (!raw) return [];

  const keys = new Set([raw]);
  const compactDigits = raw.replace(/,/g, "");
  if (/^\d+(\.0+)?$/.test(compactDigits)) {
    keys.add(String(Math.trunc(Number(compactDigits))));
  }
  return Array.from(keys);
};

const toValidDbIds = (dbIds: unknown[]) =>
  Array.from(
    new Set(
      (Array.isArray(dbIds) ? dbIds : [])
        .map(parsePositiveDbId)
        .filter((id): id is number => Number.isFinite(id) && (id || 0) > 0)
    )
  );

const getBulkPropertiesAsync = (model: any, dbIds: number[], propFilter: string[] = ELEMENT_ID_PROP_FILTER) => {
  if (!model) return Promise.reject(new Error("Viewer model is not available"));
  if (!Array.isArray(dbIds) || dbIds.length === 0) return Promise.resolve([]);

  return new Promise<any[]>((resolve, reject) => {
    model.getBulkProperties(
      dbIds,
      { propFilter },
      (results: any[]) => resolve(Array.isArray(results) ? results : []),
      (error: any) => reject(new Error(error?.message || String(error || "Bulk properties failed")))
    );
  });
};

const collectAllViewerDbIds = (model: any): number[] => {
  const tree = model?.getData?.()?.instanceTree;
  if (!tree) throw new Error("Viewer object tree is not available");

  const rootId = tree.getRootId();
  const ids: number[] = [];
  if (rootId > 0) ids.push(rootId);

  tree.enumNodeChildren(
    rootId,
    (dbId: number) => {
      if (dbId > 0) ids.push(dbId);
    },
    true
  );

  return toValidDbIds(ids);
};

const extractElementIdKeysFromBulkResult = (result: any): string[] => {
  const keys = new Set<string>();
  const properties = Array.isArray(result?.properties) ? result.properties : [];

  properties.forEach((property: any) => {
    const name = String(property?.displayName || property?.attributeName || property?.name || "")
      .trim()
      .toLowerCase();

    if (!ELEMENT_ID_PROP_NAMES.has(name)) return;
    const value = property?.displayValue ?? property?.value ?? "";
    normalizeElementIdKeys(value).forEach((key) => keys.add(key));
  });

  return Array.from(keys);
};

const buildViewerElementIdIndex = async (): Promise<Map<string, number>> => {
  if (!viewerInstance || !viewerInstance.model) throw new Error("Viewer is not initialized");

  const model = viewerInstance.model;
  const allDbIds = collectAllViewerDbIds(model);
  const index = new Map<string, number>();

  for (let i = 0; i < allDbIds.length; i += BULK_PROPS_CHUNK_SIZE) {
    const chunk = allDbIds.slice(i, i + BULK_PROPS_CHUNK_SIZE);
    const results = await getBulkPropertiesAsync(model, chunk, ELEMENT_ID_PROP_FILTER);

    results.forEach((item) => {
      const dbId = parsePositiveDbId(item?.dbId);
      if (!dbId) return;
      const keys = extractElementIdKeysFromBulkResult(item);
      keys.forEach((key) => {
        if (!index.has(key)) index.set(key, dbId);
      });
    });
  }

  return index;
};

const getViewerElementIdIndex = async (): Promise<Map<string, number>> => {
  if (viewerElementIdIndex) return viewerElementIdIndex;

  if (!viewerElementIdIndexPromise) {
    viewerElementIdIndexPromise = buildViewerElementIdIndex()
      .then((index) => {
        viewerElementIdIndex = index;
        return index;
      })
      .finally(() => {
        viewerElementIdIndexPromise = null;
      });
  }

  return viewerElementIdIndexPromise;
};

const extractDirectViewerDbIdFromRow = (row: any): number | null => {
  const candidates: unknown[] = [row?.viewerDbId, row?.dbId];
  const rawProperties = Array.isArray(row?.rawProperties) ? row.rawProperties : [];

  rawProperties.forEach((property: any) => {
    const name = String(property?.name || "").trim().toLowerCase();
    if (name === "dbid" || name === "db id") {
      candidates.push(property?.value);
    }
  });

  for (const candidate of candidates) {
    const parsed = parsePositiveDbId(candidate);
    if (parsed) return parsed;
  }

  return null;
};

const extractElementIdKeysFromRow = (row: any): string[] => {
  const keys = new Set<string>();
  normalizeElementIdKeys(row?.revitElementId).forEach((key) => keys.add(key));
  normalizeElementIdKeys(row?.externalElementId).forEach((key) => keys.add(key));
  normalizeElementIdKeys(row?.elementId).forEach((key) => keys.add(key));

  const rawProperties = Array.isArray(row?.rawProperties) ? row.rawProperties : [];
  rawProperties.forEach((property: any) => {
    const name = String(property?.name || "").trim().toLowerCase();
    if (!ELEMENT_ID_PROP_NAMES.has(name)) return;
    normalizeElementIdKeys(property?.value).forEach((key) => keys.add(key));
  });

  return Array.from(keys);
};

export const simpleViewer = async (urn: string, containerId = "TADSimpleViewer"): Promise<void> => {
  const rawUrn = String(urn || "").trim();
  if (!rawUrn) throw new Error("Missing model URN");

  await ensureViewerAssets();
  const token = await fetchViewerToken();

  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Viewer container '${containerId}' not found`);

  // Keep Autodesk viewer UI clipped to the target node.
  if (!container.style.position) container.style.position = "relative";
  container.style.overflow = "hidden";
  container.style.width = "100%";

  if (viewerInstance) {
    viewerInstance.finish();
    viewerInstance = null;
  }
  container.innerHTML = "";
  resetViewerElementIdIndex();

  await new Promise<void>((resolve, reject) => {
    Autodesk.Viewing.Initializer(
      {
        env: "AutodeskProduction",
        api: "modelDerivativeV2",
        accessToken: token,
        getAccessToken: (cb: (t: string, expiresIn: number) => void) => cb(token, 3599),
      },
      () => {
        const viewer = new Autodesk.Viewing.GuiViewer3D(container);
        const code = viewer.start();
        if (code !== 0) {
          reject(new Error(`Viewer failed to start (${code})`));
          return;
        }

        const documentId = toViewerDocumentId(rawUrn);
        Autodesk.Viewing.Document.load(
          documentId,
          (doc: any) => {
            const defaultModel = doc.getRoot().getDefaultGeometry();
            try {
              viewer.loadDocumentNode(doc, defaultModel);
              viewerInstance = viewer;
              resetViewerElementIdIndex();
              resolve();
            } catch (err: any) {
              reject(new Error(err?.message || "Failed to load document node"));
            }
          },
          (_code: number, message: string) => reject(new Error(message || "Failed to load Autodesk document"))
        );
      }
    );
  });
};

export const teardownSimpleViewer = () => {
  if (viewerInstance) {
    viewerInstance.finish();
    viewerInstance = null;
  }
  resetViewerElementIdIndex();
};

export const isolateViewerDbIds = (dbIds: number[] = []) => {
  if (!viewerInstance) return;
  const ids = toValidDbIds(dbIds);
  if (!ids.length) {
    viewerInstance.showAll();
    return;
  }

  viewerInstance.isolate(ids);
  viewerInstance.fitToView(ids);
};

export const clearViewerIsolation = () => {
  if (!viewerInstance) return;
  viewerInstance.showAll();
};

export const resolveViewerDbIdsForRows = async (rows: any[] = []): Promise<number[]> => {
  if (!viewerInstance || !viewerInstance.model) {
    throw new Error("Viewer is not initialized");
  }

  const safeRows = Array.isArray(rows) ? rows : [];
  const resolved = new Set<number>();
  const unresolvedRows: any[] = [];

  safeRows.forEach((row) => {
    const directDbId = extractDirectViewerDbIdFromRow(row);
    if (directDbId) {
      resolved.add(directDbId);
      return;
    }
    unresolvedRows.push(row);
  });

  if (unresolvedRows.length > 0) {
    const index = await getViewerElementIdIndex();
    unresolvedRows.forEach((row) => {
      const keys = extractElementIdKeysFromRow(row);
      keys.forEach((key) => {
        const dbId = index.get(key);
        if (dbId) resolved.add(dbId);
      });
    });
  }

  return Array.from(resolved.values());
};
