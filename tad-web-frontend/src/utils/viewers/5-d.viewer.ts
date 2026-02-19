import "./extensions/tad.extensions";

const BACKEND_URL = import.meta.env.VITE_API_BACKEND_BASE_URL || "http://localhost:3000";

export interface IViewer5DOptions {
  federatedModel: string; // URN (cruda o base64; con o sin "urn:")
  setSelectionCount?: (count: number) => void;
  setSelection?: (dbIds: number[]) => void;
  setIsLoadingTree?: (loading: boolean) => void;
  setCategoryData?: (data: Record<string, number>) => void;
}

declare global {
  interface Window {
    data5Dviewer: any;
  }
}

const countDbIdsInNode = (instanceTree: any, nodeId: number): number => {
  if (!instanceTree) return 0;

  let count = 0;
  if (instanceTree.getChildCount(nodeId) === 0) {
    count = 1;
  } else {
    instanceTree.enumNodeChildren(nodeId, (childId: number) => {
      count += countDbIdsInNode(instanceTree, childId);
    });
  }
  return count;
};

const toBase64Url = (s: string) =>
  btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const toViewerDocumentId = (input: string) => {
  const s = (input || "").trim();
  if (!s) throw new Error("Empty URN provided.");

  if (s.startsWith("urn:") && !s.slice(4).includes(":")) return s;
  if (!s.startsWith("urn:") && !s.includes(":")) return `urn:${s}`;

  const raw = s.startsWith("urn:") ? s : `urn:${s}`;
  return `urn:${toBase64Url(raw)}`;
};

export const data5Dviewer = async (options: IViewer5DOptions) => {
  const {
    federatedModel,
    setSelectionCount,
    setSelection,
    setIsLoadingTree,
    setCategoryData,
  } = options;

  let accessToken = "";
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/two-legged`);
    const json = await response.json();
    accessToken = json.data?.access_token || json.access_token || "";
  } catch (err) {
    console.error("Failed to fetch access token", err);
    return;
  }

  if (!accessToken) {
    console.error("Failed to fetch access token: token is empty");
    return;
  }

  const initOptions = {
    env: "AutodeskProduction",
    api: "modelDerivativeV2",
    accessToken,
    getAccessToken: (cb: (t: string, expiresIn: number) => void) => cb(accessToken, 3599),
  };

  const config = {
    extensions: [
      "CategorySelectionExtension",
      "ModeDataExtractionExtension",
      "VisibleSelectionExtension",
      "TypeNameSelectionExtension",
      "Autodesk.DocumentBrowser",
    ],
  };

  const container = document.getElementById("TAD5DViwer");
  if (!container) {
    console.error("Viewer container 'TAD5DViwer' not found!");
    return;
  }

  if (window.data5Dviewer) {
    try {
      window.data5Dviewer.finish();
      window.data5Dviewer = null;
    } catch (e) {}
  }

  const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);

  Autodesk.Viewing.Initializer(initOptions, () => {
    const code = viewer.start();
    if (code !== 0) {
      console.error("Failed to start viewer");
      return;
    }

    window.data5Dviewer = viewer;

    window.data5Dviewer.resetViewerState = () => {
      viewer.isolate([]);
      viewer.showAll();
      viewer.clearThemingColors();
    };

    window.data5Dviewer.applyColorByDiscipline = (dbIds: number[], colorHex: string) => {
      if (!viewer.model) return;

      viewer.clearThemingColors();
      const threeColor = new THREE.Color(colorHex);
      const vector = new THREE.Vector4(threeColor.r, threeColor.g, threeColor.b, 0.8);

      dbIds.forEach((id) => viewer.setThemingColor(id, vector, viewer.model));
      viewer.isolate(dbIds);
      viewer.fitToView(dbIds);
    };

    window.data5Dviewer.setFullScreen = (_enable: boolean) => {
      setTimeout(() => viewer.resize(), 100);
    };

    window.data5Dviewer.tearDown = () => {
      try {
        viewer.finish();
      } finally {
        if (window.data5Dviewer === viewer) {
          window.data5Dviewer = null;
        }
      }
    };

    viewer.setSelectionMode(Autodesk.Viewing.SelectionMode.MULTIPLE);

    let documentId = "";
    try {
      documentId = toViewerDocumentId(federatedModel);
      console.log("5D Viewer documentId:", documentId);
    } catch (e) {
      console.error("Invalid federatedModel URN:", e);
      return;
    }

    Autodesk.Viewing.Document.load(
      documentId,
      (doc: any) => {
        const defaultModel = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, defaultModel);
      },
      (errCode: number, errMsg: string) => {
        console.error("Document Load Error:", errCode, errMsg);
      }
    );

    viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, () => {
      if (setIsLoadingTree) setIsLoadingTree(false);

      if (setCategoryData && viewer.model) {
        const tree = viewer.model.getData().instanceTree;
        const rootId = tree.getRootId();
        const counts: Record<string, number> = {};

        tree.enumNodeChildren(rootId, (nodeId: number) => {
          const name = tree.getNodeName(nodeId);
          const cleanName = name.replace(/\s*\[.*?\]\s*/g, "");

          if (!counts[cleanName]) counts[cleanName] = 0;
          counts[cleanName] += countDbIdsInNode(tree, nodeId);
        });

        setCategoryData(counts);
      }
    });

    viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, (ev: any) => {
      const dbIds = ev.dbIdArray || [];
      if (setSelectionCount) setSelectionCount(dbIds.length);
      if (setSelection) setSelection(dbIds);
    });
  });
};
