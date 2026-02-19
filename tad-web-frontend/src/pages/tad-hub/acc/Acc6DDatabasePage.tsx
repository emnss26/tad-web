import React, {
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
  } from "react";
  import { useParams } from "react-router-dom";
  
  // UI Components
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { ScrollArea } from "@/components/ui/scroll-area";
  import { Badge } from "@/components/ui/badge";
  import { Loader2, Box, Cuboid } from "lucide-react";
  
  // Helpers & Constants
  import {
    mapCategoryToElementType,
    reorderRowsByDisciplineAndGroup,
  } from "@/lib/general.functions";
  import type { IRowData } from "@/lib/general.functions";
  
  import {
    disciplineOptions,
    elementtype,
    propertyMappings,
    numericFields,
  } from "@/lib/data.bases.constants";
  import { defaultRow6D } from "@/lib/default.rows";
  import {
    isolateObjectsInViewer,
    showAllObjects,
    hideObjectsInViewer,
    highlightObjectsInViewer,
    resetViewerView,
  } from "@/lib/viewer.actions";
  import { useTableControls } from "@/services/database.table";
  
  // Services & Viewer
  import { DmService } from "@/services/dm.service";
  import { data5D6Dviewer } from "@/utils/viewers/5d-6d.viewer";
  
  // Components
  import Database6DTable from "@/components/database_components/database.6d.table";
  import ControlPanel from "@/components/database_components/control.panel";
  
  const BACKEND_URL =
    import.meta.env.VITE_API_BACKEND_BASE_URL || "http://localhost:3000";
  
  const sampleQuestions = [
    "Tell me the total volume of structural foundations discipline",
    "Tell me the total volume of concrete structure discipline walls elements",
    "Isolate concrete structure",
    "Hide aluminium works",
    "dbId 31796 the planed start construction date",
    "Change dbId 31796 planned start construction date to 03/10/2025",
    "Tell me the construction start and finish dates of elements in the discipline concrete structure",
  ];
  
  // Interface idÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ntica a la usada en ProjectPage
  interface IModelFile {
    id: string;
    name: string;
    folderName: string;
    extension: string;
    urn: string;
    versionNumber?: number;
  }
  
  // IMPORTANTE: este ID debe coincidir con el que usa tu util `data5Dviewer` internamente.
  const VIEWER_CONTAINER_ID = "TAD5DViwer";
  
  const Acc6DDatabasePage = () => {
    const { projectId, accountId } = useParams<{
      projectId: string;
      accountId: string;
    }>();
  
    // --- States for Model Selection ---
    const [models, setModels] = useState<IModelFile[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
  
    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Guardamos el modelo completo (id + urn) para construir rutas API correctas
    const [selectedModel, setSelectedModel] = useState<IModelFile | null>(null);
  
    // Mantengo selectedUrn porque el resto del mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³dulo lo usa (viewer)
    const selectedUrn = selectedModel?.urn ?? null;
    const selectedModelId = selectedModel?.id ?? null;
  
    const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
    const viewerInitialized = useRef(false);
  
    // --- Data & Table States ---
    const defaultRow = useMemo(() => defaultRow6D, []);
    const propertyMapping = useMemo(() => propertyMappings["6D"], []);
  
    const [data, setData] = useState<IRowData[]>([defaultRow]);
    const [collapsedDisciplines, setCollapsedDisciplines] = useState<
      Record<string, boolean>
    >({});
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [lastClickedRowNumber, setLastClickedRowNumber] = useState<number | null>(
      null
    );
    const [groupExtraData, setGroupExtraData] = useState<
      Record<string, Record<string, string>>
    >({});
  
    // --- Viewer & UI States ---
    const [showViewer, setShowViewer] = useState(true);
    const [showAIpanel, setAIpanel] = useState(false);
    const [selectionCount, setSelectionCount] = useState(0);
    const [categoryData, setCategoryData] = useState<Record<string, number>>({});
    const [isLoadingTree, setIsLoadingTree] = useState(false);
    const [loading, setLoading] = useState(false); // Local loading overlay
  
    const [syncViewerSelection, setSyncViewerSelection] = useState(false);
    const syncViewerSelectionRef = useRef(false);
    const [selectedDisciplineForColor, setSelectedDisciplineForColor] =
      useState("");
    const [selectedColor, setSelectedColor] = useState("#ff0000");
    const [isFullScreen, setIsFullScreen] = useState(false);
  
    // --- AI Chat States ---
    const [userMessage, setUserMessage] = useState("");
    const [chatbotResponse, setChatbotResponse] = useState("");
    const [conversationHistory, setConversationHistory] = useState(
      JSON.parse(localStorage.getItem("conversationHistory6D") || "[]")
    );
  
    // --- Table Controls Hook ---
    const { handleAddRow, handleRemoveRow } = useTableControls<IRowData>(
      setData,
      defaultRow,
      reorderRowsByDisciplineAndGroup
    );
  
    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ API base: respeta /api y agrega /models/:modelId
    const apiBase = useMemo(() => {
      if (!accountId || !projectId || !selectedModelId) return null;
      return `${BACKEND_URL}/api/modeldata/${accountId}/${projectId}/models/${selectedModelId}/data`;
    }, [accountId, projectId, selectedModelId]);
  
    // Reset bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡sico si cambias de proyecto/cuenta (evita ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“estado viejoÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â)
    useEffect(() => {
      setModels([]);
      setSelectedModel(null);
      viewerInitialized.current = false;
  
      // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ limpia tabla/selecciones tambiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©n
      setData([defaultRow]);
      setSelectedRows([]);
      setSelectionCount(0);
      setCollapsedDisciplines({});
      setGroupExtraData({});
    }, [projectId, accountId, defaultRow]);
  
    // ------------------------------------------
    // 1. Model Selection Logic
    // ------------------------------------------
    const handleFetchModels = async () => {
      if (models.length > 0 || !projectId || !accountId) return;
  
      try {
        setLoadingModels(true);
        const result = await DmService.getProjectModels(projectId, accountId);
        setModels(result.data || []);
      } catch (err) {
        console.error("Error fetching models:", err);
      } finally {
        setLoadingModels(false);
      }
    };
  
    const openModelDialogAndFetch = () => {
      setIsModelDialogOpen(true);
      handleFetchModels();
    };
  
    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Limpia tabla y selecciona modelo (id + urn)
    const handleSelectModel = (file: IModelFile) => {
      setShowViewer(true);
  
      // Soft reset viewer
      try {
        const container = document.getElementById(VIEWER_CONTAINER_ID);
        if (container) container.innerHTML = "";
      } catch {}
  
      try {
        if (
          window.data5Dviewer &&
          typeof (window.data5Dviewer as any).tearDown === "function"
        ) {
          (window.data5Dviewer as any).tearDown();
        }
      } catch {}
  
      viewerInitialized.current = false;
  
      // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Limpia tabla/selecciones al cambiar modelo (flujo requerido)
      setData([defaultRow]);
      setSelectedRows([]);
      setSelectionCount(0);
      setCollapsedDisciplines({});
      setLastClickedRowNumber(null);
      setGroupExtraData({});
  
      // Reset temporal para forzar efecto del viewer
      setSelectedModel(null);
      setTimeout(() => {
        setSelectedModel(file);
        setIsModelDialogOpen(false);
      }, 50);
    };
  
    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Auto-pull: al seleccionar modelo, trae la data del modelo correcto
    useEffect(() => {
      if (!apiBase) return;
      // No alert aquÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­: solo carga
      (async () => {
        setLoading(true);
        try {
          const response = await fetch(apiBase, { credentials: "include" });
          if (!response.ok) {
            // si no hay data aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºn, deja defaultRow
            setData([defaultRow]);
            return;
          }
          const res = await response.json();
          const items = Array.isArray(res.data) ? res.data : [];
  
          if (!items.length) {
            setData([defaultRow]);
            return;
          }
  
          const loadedRows = items.map((item: any) => ({
            ...defaultRow,
            ...item,
          }));
  
          setData(reorderRowsByDisciplineAndGroup(loadedRows));
        } catch (e) {
          console.error(e);
          setData([defaultRow]);
        } finally {
          setLoading(false);
        }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase]);
  
    // ------------------------------------------
    // 2. Viewer Initialization
    // ------------------------------------------
    const dataRef = useRef<IRowData[]>([defaultRow]);
  
    useEffect(() => {
      dataRef.current = data;
    }, [data]);
  
    const handleViewerSelectionChanged = useCallback((dbIdArray: number[]) => {
      const currentData = dataRef.current || [];
  
      const foundDbIds = currentData
        .filter((row) => {
          const rowDbIdNum = Number(row.dbId);
          return Number.isFinite(rowDbIdNum) && dbIdArray.includes(rowDbIdNum);
        })
        .map((row) => row.dbId!);
  
      setSelectedRows(foundDbIds);
      setSelectionCount(dbIdArray.length);
    }, []);
  
    useEffect(() => {
      syncViewerSelectionRef.current = syncViewerSelection;
      if (syncViewerSelection && window.data5Dviewer) {
        const currentDbIds = window.data5Dviewer.getSelection() || [];
        handleViewerSelectionChanged(currentDbIds);
      }
    }, [syncViewerSelection, handleViewerSelectionChanged]);
  
    useEffect(() => {
      if (!selectedUrn || !showViewer) return;
      if (viewerInitialized.current) return;
  
      const conditionalSelectionHandler = (dbIdArray: number[]) => {
        if (!syncViewerSelectionRef.current) return;
        handleViewerSelectionChanged(dbIdArray);
      };
  
      const t = setTimeout(() => {
        console.log("Initializing 6D Viewer with URN:", selectedUrn);
  
        data5D6Dviewer({
          federatedModel: selectedUrn,
          setSelectionCount,
          setSelection: conditionalSelectionHandler,
          setIsLoadingTree,
          setCategoryData: (cats) => setCategoryData(cats),
        });
  
        viewerInitialized.current = true;
      }, 100);
  
      return () => {
        clearTimeout(t);
        viewerInitialized.current = false;
      };
    }, [selectedUrn, showViewer, handleViewerSelectionChanged]);
  
    const handleToggleViewer = () => setShowViewer((prev) => !prev);
  
    const handleToggleFullScreen = () => {
      if (window.data5Dviewer && (window.data5Dviewer as any).setFullScreen) {
        (window.data5Dviewer as any).setFullScreen(!isFullScreen);
        setIsFullScreen(!isFullScreen);
      }
    };
  
    // ------------------------------------------
    // 4. Data Extraction Event Listener
    // ------------------------------------------
    useEffect(() => {
      const handleDataExtracted = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { dbId, properties } = customEvent.detail;
  
        if (!properties || typeof properties !== "object") {
          console.error("Invalid properties data:", properties);
          return;
        }
  
        const propertiesArray = Object.entries(properties).map(([k, v]) => ({
          displayName: k,
          displayValue: String(v || ""),
        }));
  
        const mappedProperties = propertiesArray.reduce((acc: any, prop) => {
          const mappedKey = (propertyMapping as any)[prop.displayName];
          let value = prop.displayValue;
  
          if (mappedKey && mappedKey.toLowerCase().includes("date")) {
            if (value.toLowerCase() === "no especificado") {
              value = "";
            } else {
              const parts = value.split("/");
              if (parts.length === 3) {
                const [day, month, year] = parts;
                const fullYear = year.length === 2 ? `20${year}` : year;
                value = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(
                  2,
                  "0"
                )}`;
              }
            }
          }
  
          if (mappedKey) {
            acc[mappedKey] = value;
          }
          return acc;
        }, {});
  
        const fieldsToCheck = [
          "TypeName",
          "Description",
          "Length",
          "Width",
          "Height",
          "Perimeter",
          "Area",
          "Thickness",
          "Volume",
          "Level",
          "Material",
          "EnergyConsumption",
          "CarbonFootprint",
          "WaterConsumption",
          "LifeCycleStage",
          "LEEDCategory",
          "LEEDCredit",
        ];
        fieldsToCheck.forEach((field) => {
          if (!mappedProperties[field]) mappedProperties[field] = "";
        });
  
        const elementType =
          mapCategoryToElementType((properties as any).Category) || "";
        const newRow: IRowData = {
          ...defaultRow,
          dbId: String(dbId),
          ElementType: elementType,
          ...mappedProperties,
        };
  
        setData((prevData) => {
          const existsDbId = prevData.some(
            (r) => String(r.dbId) === String(dbId)
          );
          if (existsDbId) {
            alert("This element is already in the table");
            return prevData;
          }
          const updatedData = [...prevData, newRow];
          return reorderRowsByDisciplineAndGroup(updatedData);
        });
      };
  
      window.addEventListener("dbIdDataExtracted", handleDataExtracted);
      return () => {
        window.removeEventListener("dbIdDataExtracted", handleDataExtracted);
      };
    }, [defaultRow, propertyMapping]);
  
    // ------------------------------------------
    // 5. Calculations (Totals)
    // ------------------------------------------
    const groupedData = useMemo(() => {
      return data.reduce((acc: Record<string, IRowData[]>, row) => {
        const discipline = row.Discipline || "No Discipline";
        if (!acc[discipline]) acc[discipline] = [];
        acc[discipline].push(row);
        return acc;
      }, {});
    }, [data]);
  
    const calculateTotals = (rows: IRowData[]) => {
      const totals: Record<string, number> = {
        Length: 0,
        Width: 0,
        Height: 0,
        Perimeter: 0,
        Area: 0,
        Volume: 0,
        EnergyConsumption: 0,
        CarbonFootprint: 0,
        WaterConsumption: 0,
      };
      rows.forEach((row) => {
        Object.keys(totals).forEach((key) => {
          totals[key] += parseFloat((row as any)[key]) || 0;
        });
      });
      return totals;
    };
  
    const totalsByDiscipline = useMemo(() => {
      return Object.keys(groupedData).reduce((acc: any, disc) => {
        acc[disc] = calculateTotals(groupedData[disc]);
        return acc;
      }, {});
    }, [groupedData]);
  
    const grandTotals = useMemo(() => calculateTotals(data), [data]);
  
    // ------------------------------------------
    // 6. Handlers
    // ------------------------------------------
    const handleInputChange = (
      row: IRowData,
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const { name, value } = event.target;
      setData((prev) => {
        const updatedData = prev.map((item) => {
          if (
            selectedRows.includes(row.dbId!) &&
            selectedRows.includes(item.dbId!)
          ) {
            return { ...item, [name]: value } as any;
          }
          if (item.dbId === row.dbId) {
            return { ...item, [name]: value } as any;
          }
          return item;
        });

        if (name === "Code") {
          return reorderRowsByDisciplineAndGroup(updatedData);
        }
        return updatedData;
      });
    };
  
    const handleDisciplineChange = (row: IRowData, newValue: string) => {
      setData((prev) => {
        const updatedData = prev.map((item) => {
          if (
            selectedRows.includes(row.dbId!) &&
            selectedRows.includes(item.dbId!)
          ) {
            return { ...item, Discipline: newValue };
          }
          if (item.dbId === row.dbId) {
            return { ...item, Discipline: newValue };
          }
          return item;
        });
        return reorderRowsByDisciplineAndGroup(updatedData);
      });
    };
  
    const handleElementTypeChange = (row: IRowData, newValue: string) => {
      setData((prev) =>
        prev.map((item) => {
          if (
            selectedRows.includes(row.dbId!) &&
            selectedRows.includes(item.dbId!)
          ) {
            return { ...item, ElementType: newValue };
          }
          if (item.dbId === row.dbId) {
            return { ...item, ElementType: newValue };
          }
          return item;
        })
      );
    };
  
    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Submit: usa apiBase y NO manda defaultRow (dbId vacÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­o) para evitar 400 validator
    const handleSubmit = async () => {
      if (!apiBase) return alert("Select a model first");
  
      setLoading(true);
      try {
        const rowsToSend = data
          .filter((r) => r.dbId && String(r.dbId).trim())
          .map((row) => {
            const cleaned: any = { ...row };
            const submitNumericFields = Array.from(
              new Set([...numericFields, "WaterConsumption"])
            );
            submitNumericFields.forEach((field) => {
              const val = cleaned[field];
              if (typeof val === "string" && val.trim() !== "") {
                const num = parseFloat(val);
                cleaned[field] = isNaN(num) ? null : num;
              } else if (val === undefined || val === "") {
                cleaned[field] = null;
              }
            });
            return cleaned;
          });
  
        const CHUNK_SIZE = 500;
        for (let i = 0; i < rowsToSend.length; i += CHUNK_SIZE) {
          const chunk = rowsToSend.slice(i, i + CHUNK_SIZE);
          await fetch(apiBase, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(chunk),
          });
        }
  
        alert("Data uploaded successfully!");
      } catch (error: any) {
        console.error("Error submitting data", error);
        alert("Error submitting data: " + error.message);
      } finally {
        setLoading(false);
      }
    };
  
    // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Pull: usa apiBase con ?discipline=... y credentials
    const handlePullData = async (discipline: string | null = null) => {
      if (!apiBase) return alert("Select a model first");
  
      setLoading(true);
      try {
        let url = apiBase;
        if (discipline && discipline !== "All Disciplines") {
          url += `?discipline=${encodeURIComponent(discipline)}`;
        }
  
        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) {
          alert("Failed to load data");
          return;
        }
  
        const res = await response.json();
        const items = Array.isArray(res.data) ? res.data : [];
  
        if (!items.length) {
          setData([defaultRow]);
          alert("No data found for this model");
          return;
        }
  
        const loadedRows = items.map((item: any) => ({
          ...defaultRow,
          ...item,
        }));
  
        setData(reorderRowsByDisciplineAndGroup(loadedRows));
        alert("Data loaded successfully");
      } catch (error) {
        console.error(error);
        alert("Error loading data");
      } finally {
        setLoading(false);
      }
    };
  
    const handleSendMessage = async () => {
      if (!userMessage.trim()) return;
      setLoading(true);
      try {
        const body = {
          message: userMessage,
          accountId,
          projectId,
          contextData: null,
        };
  
        // (no lo tocamos para no afectar IA; aunque ahorita no lo usarÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡n)
        const res = await fetch(`${BACKEND_URL}/ai-modeldata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
  
        const dataRes = await res.json();
        setChatbotResponse(dataRes.data?.reply || "No response");
  
        if (dataRes.action && dataRes.dbIds && window.data5Dviewer) {
          const actions: any = {
            isolate: isolateObjectsInViewer,
            hide: hideObjectsInViewer,
            highlight: highlightObjectsInViewer,
          };
          if (actions[dataRes.action]) {
            actions[dataRes.action](window.data5Dviewer, dataRes.dbIds);
          }
        }
      } catch (error) {
        console.error(error);
        setChatbotResponse("Error processing request");
      } finally {
        setLoading(false);
      }
    };
  
    const handleApplyColorToDiscipline = () => {
      if (
        window.data5Dviewer &&
        (window.data5Dviewer as any).applyColorByDiscipline
      ) {
        const idsToColor = data
          .filter((r) => r.Discipline === selectedDisciplineForColor)
          .map((r) => parseInt(r.dbId!, 10));
        (window.data5Dviewer as any).applyColorByDiscipline(
          idsToColor,
          selectedColor
        );
      }
    };

    const handleGroupExtraDataChange = (
      group: string,
      field: string,
      value: string
    ) => {
      setGroupExtraData((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          [field]: value,
        },
      }));
    };

    const calculateGroupTotal = (group: string) => {
      const extra = groupExtraData[group] || {};
      const quantity = parseFloat(extra.Quantity || "0") || 0;
      const price = parseFloat(extra.UnitPrice || "0") || 0;
      const total = quantity * price;
      return total ? total.toFixed(2) : "";
    };

    const nestedGroupData = useMemo(() => {
      const grouped: Record<string, Record<string, IRowData[]>> = {};
      data.forEach((row) => {
        const discipline = String(row.Discipline || "No Discipline");
        const code = String(row.Code || "No Code");
        if (!grouped[discipline]) grouped[discipline] = {};
        if (!grouped[discipline][code]) grouped[discipline][code] = [];
        grouped[discipline][code].push(row);
      });
      return grouped;
    }, [data]);

    useEffect(() => {
      Object.entries(groupExtraData).forEach(([groupKey, extra]) => {
        const unit = extra.Unit;
        if (!unit) return;

        const [discipline, code] = groupKey.split("||");
        const rows = nestedGroupData[discipline]?.[code] || [];
        let total = 0;

        if (unit === "m" || unit === "kg/m") {
          total = rows.reduce((sum, r) => sum + (parseFloat(String(r.Length || 0)) || 0), 0);
        } else if (unit === "m2") {
          total = rows.reduce((sum, r) => sum + (parseFloat(String(r.Area || 0)) || 0), 0);
        } else if (unit === "m3") {
          total = rows.reduce((sum, r) => sum + (parseFloat(String(r.Volume || 0)) || 0), 0);
        }

        const newQuantity = total.toFixed(2);
        if (newQuantity !== extra.Quantity) {
          setGroupExtraData((prev) => ({
            ...prev,
            [groupKey]: {
              ...prev[groupKey],
              Quantity: newQuantity,
            },
          }));
        }
      });
    }, [groupExtraData, nestedGroupData]);
  
    useEffect(() => {
      localStorage.setItem(
        "conversationHistory6D",
        JSON.stringify(conversationHistory)
      );
    }, [conversationHistory]);
  
    // --- UI Class calculations ---
    const viewerWidthClass = useMemo(() => {
      if (!showViewer) return "w-0";
      return "w-2/5";
    }, [showViewer]);
  
    const tableWidthClass = useMemo(() => {
      if (!showViewer && !showAIpanel) return "w-full";
      if (showViewer && !showAIpanel) return "w-3/5";
      if (showViewer && showAIpanel) return "w-2/5";
      if (!showViewer && showAIpanel) return "w-4/5";
      return "w-full";
    }, [showViewer, showAIpanel]);
  
    const aiWidthClass = useMemo(() => (showAIpanel ? "w-1/5" : "w-0"), [showAIpanel]);
  
    return (
      <div className="flex flex-col h-full bg-gray-50/50 relative">
        {/* Loading Overlay Local */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
  
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-6 overflow-auto">
            {/* Header Area with Model Selection */}
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Model Database 6D{selectedModel?.name ? ` - ${selectedModel.name}` : ""}
              </h1>
  
              {/* MODEL SELECTION DIALOG */}
              <Dialog
                open={isModelDialogOpen}
                onOpenChange={(open) => {
                  setIsModelDialogOpen(open);
                  if (open) handleFetchModels();
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleFetchModels}
                    className="shadow-sm"
                  >
                    <Cuboid className="mr-2 h-4 w-4 text-blue-600" />
                    {selectedUrn ? "Change Model" : "Select Model"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Select a Model</DialogTitle>
                  </DialogHeader>
  
                  {loadingModels ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Loading models...
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] pr-4">
                      {models.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No models found in this project.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {models.map((file) => (
                            <div
                              key={file.id}
                              onClick={() => handleSelectModel(file)} // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ pasa modelo completo
                              className="flex items-center justify-between p-3 rounded-md border hover:bg-accent cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded text-primary">
                                  <Box className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm group-hover:underline">
                                    {file.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Folder: {file.folderName}
                                  </span>
                                </div>
                              </div>
                              {file.versionNumber && (
                                <Badge variant="secondary" className="text-xs">
                                  v{file.versionNumber}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </DialogContent>
              </Dialog>
            </div>
  
            <div className="mb-6">
              <ControlPanel
                viewer={window.data5Dviewer}
                showViewer={showViewer}
                toggleViewer={handleToggleViewer}
                showAIpanel={showAIpanel}
                setAIpanel={setAIpanel}
                syncViewerSelection={syncViewerSelection}
                setSyncViewerSelection={setSyncViewerSelection}
                resetViewerView={resetViewerView}
                showAllObjects={showAllObjects}
                handleAddRow={handleAddRow}
                handleRemoveRow={() => handleRemoveRow(-1)}
                handleSubmit={handleSubmit} // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ ya usa modelId
                handlePullData={handlePullData} // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ ya usa modelId
                disciplineOptions={disciplineOptions}
                selectedDisciplineForColor={selectedDisciplineForColor}
                setSelectedDisciplineForColor={setSelectedDisciplineForColor}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                handleApplyColorToDiscipline={handleApplyColorToDiscipline}
              />
            </div>
  
            {/* Main Content Area */}
            <div className="flex gap-4 transition-all duration-300 h-[650px]">
              {/* Viewer */}
              <div
                className={`transition-all duration-300 flex flex-col bg-white border rounded-xl shadow-sm overflow-hidden ${viewerWidthClass} ${
                  !showViewer ? "hidden" : ""
                }`}
              >
                <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Cuboid className="h-4 w-4 text-gray-500" /> Model Viewer
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFullScreen}
                    className="h-7 text-xs"
                  >
                    {isFullScreen ? "Exit Full Screen" : "Expand"}
                  </Button>
                </div>
  
                <div className="relative flex-1 bg-gray-100 overflow-hidden">
                  {selectedUrn ? (
                    <div
                      id={VIEWER_CONTAINER_ID}
                      className="absolute inset-0 w-full h-full"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Box className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-900">No Model Selected</h3>
                      <p className="text-sm mt-1 mb-4">
                        Select a model to start 6D visualization.
                      </p>
  
                      <Button variant="outline" onClick={openModelDialogAndFetch}>
                        Select Model
                      </Button>
                    </div>
                  )}
                </div>
              </div>
  
              {/* Table */}
              <div
                className={`transition-all duration-300 flex flex-col ${tableWidthClass}`}
              >
                <Database6DTable
                  viewer={window.data5Dviewer}
                  data={data}
                  totalsByDiscipline={totalsByDiscipline}
                  grandTotals={grandTotals}
                  handleInputChange={handleInputChange}
                  handleDisciplineChange={handleDisciplineChange}
                  handleElementTypeChange={handleElementTypeChange}
                  disciplineOptions={disciplineOptions}
                  elementtype={elementtype}
                  isolateObjectsInViewer={isolateObjectsInViewer}
                  hideObjectsInViewer={hideObjectsInViewer}
                  collapsedDisciplines={collapsedDisciplines}
                  setCollapsedDisciplines={setCollapsedDisciplines}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                  lastClickedRowNumber={lastClickedRowNumber}
                  setLastClickedRowNumber={setLastClickedRowNumber}
                />
              </div>
  
              {/* AI Panel */}
              {showAIpanel && (
                <div
                  className={`transition-all duration-300 flex flex-col bg-white border rounded-xl shadow-sm overflow-hidden ${aiWidthClass}`}
                >
                  <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                    <h2 className="text-sm font-semibold">AI Assistant</h2>
                  </div>
  
                  <div className="flex flex-col flex-1 p-4 bg-gray-50/50">
                    <div className="flex-1 overflow-y-auto mb-4 bg-white border rounded-md p-3 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Response
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {chatbotResponse || "Ask me anything about your model data..."}
                      </p>
                    </div>
  
                    <div className="mt-auto space-y-3">
                      <textarea
                        className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none bg-white"
                        rows={3}
                        placeholder="Type your question..."
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!userMessage.trim()}
                        className="w-full"
                        size="sm"
                      >
                        Send Question
                      </Button>
                    </div>
  
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        Suggestions
                      </p>
                      <div className="flex flex-col gap-1">
                        {sampleQuestions.slice(0, 3).map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => setUserMessage(q)}
                            className="text-xs text-left p-2 rounded hover:bg-gray-200 text-gray-600 transition-colors truncate"
                          >
                            - {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
  
            <div className="h-6"></div>
          </div>
        </div>
      </div>
    );
  };
  
  export default React.memo(Acc6DDatabasePage);


