import "./extensions/tad.extensions";

const BACKEND_URL = import.meta.env.VITE_API_BACKEND_BASE_URL || "http://localhost:3000";

// --- Interfaces ---

export interface I4DItem {
  dbId: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
}

export interface IViewer4DOptions {
  federatedModel: string; // URN
  setSelectionCount?: (count: number) => void;
  setSelection?: (dbIds: number[]) => void;
  setIsLoadingTree?: (loading: boolean) => void;
  setCategoryData?: (data: Record<string, number>) => void;
}

// Declaración global para extender Window y añadir nuestro visor
declare global {
  interface Window {
    data4Dviewer: any;
    // Autodesk y THREE ya están definidos en src/types/autodesk.d.ts
    viewerInitialized: boolean;
  }
}

// --- Helper Functions ---

const parseDataDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // JS months are 0-based
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
};

const countDbIdsInNode = (instanceTree: any, nodeId: number): number => {
  if (!instanceTree) return 0;
  
  let count = 0;
  if (instanceTree.getChildCount(nodeId) === 0) {
      // Es hoja
      count = 1;
  } else {
      instanceTree.enumNodeChildren(nodeId, (childId: number) => {
          count += countDbIdsInNode(instanceTree, childId);
      });
  }
  return count;
};

// --- Main Viewer Function ---

export const data4Dviewer = async (options: IViewer4DOptions) => {
  const { federatedModel, setSelectionCount, setSelection, setIsLoadingTree, setCategoryData } = options;

  // 1. Fetch Token
  let accessToken = "";
  try {
      const response = await fetch(`${BACKEND_URL}/auth/token`);
      const json = await response.json();
      accessToken = json.data.access_token;
  } catch (err) {
      console.error("Failed to fetch access token", err);
      return;
  }

  // 2. Viewer Config
  const initOptions = {
    env: "AutodeskProduction",
    api: "modelDerivativeV2",
    accessToken: accessToken,
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

  const container = document.getElementById("TAD4DViwer");
  if (!container) {
    console.error("Viewer container 'TAD4DViwer' not found!");
    return;
  }

  // Limpiar instancia previa si existe para evitar fugas de memoria
  if (window.data4Dviewer) {
      try {
          window.data4Dviewer.finish();
          window.data4Dviewer = null;
      } catch(e) {}
  }

  const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);

  // --- 4D Logic State Encapsulation ---
  let _data4D: I4DItem[] = [];
  
  const updateViewerVisibility = (currentDate: Date) => {
    if(!viewer.model) return;

    const idsToShow: number[] = [];
    const idsToColor: number[] = [];
    
    // Color azul semitransparente para elementos completados/en curso
    const colorVector = new THREE.Vector4(0, 0, 1, 0.5);

    _data4D.forEach(({ dbId, startDate, endDate }) => {
        const start = parseDataDate(startDate);
        const end = parseDataDate(endDate);

        if (!start || !end) return;

        if (currentDate >= start) {
            idsToShow.push(dbId);
            if (currentDate <= end) {
                idsToColor.push(dbId);
            }
        }
    });

    viewer.hideAll();
    viewer.show(idsToShow);
    viewer.clearThemingColors();

    idsToColor.forEach(dbId => {
        viewer.setThemingColor(dbId, colorVector, viewer.model);
    });
  };

  const handleSliderChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      const sliderValue = parseFloat(input.value);

      if (!_data4D.length) return;

      // Inicializamos con valores seguros numéricos
      let earliest: number = Infinity;
      let latest: number = -Infinity;
      let hasValidDates = false;

      _data4D.forEach(item => {
          const s = parseDataDate(item.startDate)?.getTime();
          const e = parseDataDate(item.endDate)?.getTime();
          
          if (s) {
              if (s < earliest) earliest = s;
              hasValidDates = true;
          }
          if (e) {
              if (e > latest) latest = e;
              hasValidDates = true;
          }
      });

      if (!hasValidDates || earliest === Infinity || latest === -Infinity) return;

      // Buffer de 1 día al final
      latest += 1000 * 60 * 60 * 24; 
      
      const totalDuration = latest - earliest;
      const currentTimestamp = earliest + (sliderValue / 100) * totalDuration;
      const currentDate = new Date(currentTimestamp);

      updateViewerVisibility(currentDate);

      const dateDisplay = document.getElementById("currentDateDisplay");
      if (dateDisplay) {
          dateDisplay.textContent = `Current date: ${currentDate.toLocaleDateString("en-US")}`;
      }
  };

  // --- Initialization ---
  Autodesk.Viewing.Initializer(initOptions, () => {
    const code = viewer.start();
    if (code !== 0) {
      console.error("Failed to start viewer");
      return;
    }

    window.data4Dviewer = viewer;

    window.data4Dviewer.set4DData = (newData: I4DItem[]) => {
        _data4D = newData;
        console.log(`Viewer: 4D Data updated with ${newData.length} items.`);
    };

    window.data4Dviewer.resetViewerState = () => {
        viewer.showAll();
        viewer.clearThemingColors();
        _data4D = [];
        const slider = document.getElementById("dateSlider") as HTMLInputElement;
        if(slider) slider.value = "0";
        
        const dateDisplay = document.getElementById("currentDateDisplay");
        if(dateDisplay) dateDisplay.textContent = "Current date: N/A";
    };
    
    window.data4Dviewer.applyColorByDiscipline = (dbIds: number[], colorHex: string) => {
        viewer.clearThemingColors();
        const threeColor = new THREE.Color(colorHex);
        const vector = new THREE.Vector4(threeColor.r, threeColor.g, threeColor.b, 0.8);
        dbIds.forEach(id => viewer.setThemingColor(id, vector, viewer.model));
        viewer.isolate(dbIds);
        viewer.fitToView(dbIds);
    };

    window.data4Dviewer.setFullScreen = (enable: boolean) => {
        setTimeout(() => viewer.resize(), 100);
    };

    viewer.setSelectionMode(Autodesk.Viewing.SelectionMode.MULTIPLE);

    const documentId = `urn:${federatedModel}`;
    Autodesk.Viewing.Document.load(documentId, (doc) => {
        const defaultModel = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, defaultModel);
    }, (errCode, errMsg) => {
        console.error("Document Load Error:", errCode, errMsg);
    });

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

    const slider = document.getElementById("dateSlider");
    if (slider) {
        const newSlider = slider.cloneNode(true);
        slider.parentNode?.replaceChild(newSlider, slider);
        newSlider.addEventListener("input", handleSliderChange);
    }
  });
};