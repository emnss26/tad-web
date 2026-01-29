import React, {
    useState,
    useRef,
    useMemo,
    useCallback,
    useEffect,
    type ChangeEvent, // Añadido 'type'
    type MouseEvent,  // Añadido 'type'
  } from "react";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import {
    Eye,
    EyeOff,
    ChevronDown,
    ChevronRight,
    Loader2,
    Search,
    ChevronFirst,
    ChevronLast,
    Filter,
    ChevronLeft,
  } from "lucide-react";
  import { Badge } from "@/components/ui/badge";
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip";
  import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { toast } from "sonner"; // Ajusta el path si es necesario
  import type { IRowData } from "@/lib/general.functions"; // Asegúrate de exportar IRowData
  
  /** =============== 1) CONSTANTES Y TIPOS =============== */
  
  const disciplineColorMap: Record<string, { bg: string; text: string }> = {
    "Preliminary Works": { bg: "bg-[#2ea3e3]", text: "text-white" },
    "Structural Foundations": { bg: "bg-[#2ea3e3]", text: "text-white" },
    "Concrete Structure": { bg: "bg-[#2ea3e3]", text: "text-white" },
    "Metallic Structure": { bg: "bg-[#2ea3e3]", text: "text-white" },
    "Masonry Works": { bg: "bg-[#2ea3e3]", text: "text-white" },
    "Walls and Ceilings": { bg: "bg-[#2ea3e3]", text: "text-white" },
    "Aluminium works windows and glazing": { bg: "bg-[#2ea3e3]", text: "text-white" },
    Blaksmithing: { bg: "bg-[#2ea3e3]", text: "text-white" },
    Finishes: { bg: "bg-[#2ea3e3]", text: "text-white" },
    Furniture: { bg: "bg-[#2ea3e3]", text: "text-white" },
    Carpentry: { bg: "bg-[#2ea3e3]", text: "text-white" },
    Mechanical: { bg: "bg-[#2ea3e3]", text: "text-white" },
    Electrical: { bg: "bg-[#2ea3e3]", text: "text-white" },
    Plumbing: { bg: "bg-[#2ea3e3]", text: "text-white" },
    "Fire Protection": { bg: "bg-[#2ea3e3]", text: "text-white" },
    "Special Systems": { bg: "bg-[#2ea3e3]", text: "text-white" },
  };
  
  const elementTypeColorMap: Record<string, string> = {
    Walls: "#ef4444",
    Doors: "#3b82f6",
    Windows: "#eab308",
    Floors: "#22c55e",
    "Structural Foundations": "#a855f7",
    "Structural Columns": "#f97316",
    Pipe: "#fdba74",
    Duct: "#5eead4",
  };
  const fallbackTypeColor = "#6b7280";
  
  const columnGroups: Record<string, string[]> = {
    general: ["rowNumber", "dbId", "Discipline", "ElementType", "TypeName"],
    dimensions: [
      "rowNumber",
      "TypeName",
      "Length",
      "Width",
      "Height",
      "Perimeter",
      "Area",
      "Thickness",
      "Volume",
    ],
    description: [
      "rowNumber",
      "ElementType",
      "TypeName",
      "Description",
      "Level",
      "Material",
    ],
    schedule: [
      "rowNumber",
      "TypeName",
      "PlanedConstructionStartDate",
      "PlanedConstructionEndDate",
      "RealConstructionStartDate",
      "RealConstructionEndDate",
    ],
  };
  
  const numericColumns = [
    "LENGTH",
    "WIDTH",
    "HEIGHT",
    "PERIMETER",
    "AREA",
    "THICKNESS",
    "VOLUME",
  ];
  
  /** =============== SUBCOMPONENTES =============== */
  
  interface DisciplineHeaderProps {
    discipline: string;
    rowsCount: number;
    isDiscCollapsed: boolean;
    onToggle: () => void;
    visibleColsCount: number;
    isolateDiscipline: () => void;
    hideDiscipline: () => void;
  }
  
  const DisciplineHeaderRow = React.memo(({
    discipline,
    rowsCount,
    isDiscCollapsed,
    onToggle,
    visibleColsCount,
    isolateDiscipline,
    hideDiscipline,
  }: DisciplineHeaderProps) => {
    return (
      <TableRow className="uppercase bg-gray-100 text-black font-bold transition-colors hover:bg-[#2ea3e3] hover:text-white">
        <TableCell colSpan={visibleColsCount}>
          <div className="flex items-center">
            <button
              onClick={onToggle}
              className="mr-2 text-black hover:bg-[#2ea3e3] p-1 rounded transition-colors"
              aria-label={isDiscCollapsed ? "Expand discipline" : "Collapse discipline"}
            >
              {isDiscCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            <span>{discipline}</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {rowsCount}
            </Badge>
          </div>
        </TableCell>
  
        <TableCell className="text-right">
          <div className="flex gap-1 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); isolateDiscipline(); }}
                    className="bg-gray-100 text-black"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Isolate this discipline</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
  
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); hideDiscipline(); }}
                    className="bg-gray-100 text-black"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hide this discipline</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>
    );
  });
  
  interface ElementRowProps {
    row: IRowData;
    visibleColumns: string[];
    isSelected: boolean;
    onRowClick: (e: React.MouseEvent) => void;
    handleInputChange: (row: IRowData, e: ChangeEvent<HTMLInputElement>) => void;
    handleDisciplineChange: (row: IRowData, val: string) => void;
    handleElementTypeChange: (row: IRowData, val: string) => void;
    disciplineOptions: string[];
    elementtype: string[];
    isolateRow: (dbId: string) => void;
    index: number;
    isDimensionsView: boolean;
    hoverColor: string;
  }
  
  const ElementRow = React.memo(({
    row,
    visibleColumns,
    isSelected,
    onRowClick,
    handleInputChange,
    handleDisciplineChange,
    handleElementTypeChange,
    disciplineOptions,
    elementtype,
    isolateRow,
    index,
    isDimensionsView,
    hoverColor,
  }: ElementRowProps) => {
    const getElementTypeColor = (type: string) => elementTypeColorMap[type] || fallbackTypeColor;
    const displayedRowNumber = row.rowNumber !== undefined ? row.rowNumber : index + 1;
    const rowClass = isSelected ? `bg-blue-100 hover:bg-blue-100` : `hover:${hoverColor}`;
  
    return (
      <TableRow
        className={`border-l-4 cursor-pointer ${rowClass} transition-colors`}
        style={{ borderLeftColor: getElementTypeColor(row.ElementType) }}
        onClick={onRowClick}
      >
        {visibleColumns.map((col) => {
          if (col === "rowNumber") {
            return (
              <TableCell key={col} className="font-medium text-center">
                {displayedRowNumber}
              </TableCell>
            );
          }
          if (col === "dbId") {
            return (
              <TableCell key={col} className="text-center">
                {row.dbId}
              </TableCell>
            );
          }
          if (
            ["PlanedConstructionStartDate", "PlanedConstructionEndDate", "RealConstructionStartDate", "RealConstructionEndDate"].includes(col)
          ) {
            return (
              <TableCell key={col}>
                <Input
                  type="date"
                  name={col}
                  value={row[col] || ""}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => handleInputChange(row, e)}
                  className="h-8 text-sm"
                />
              </TableCell>
            );
          }
          if (col === "Discipline") {
            return (
              <TableCell key={col}>
                <Select
                  value={row[col] || ""}
                  onValueChange={(val) => handleDisciplineChange(row, val)}
                >
                  <SelectTrigger className="h-8 text-sm bg-white text-black" onMouseDown={(e) => e.stopPropagation()}>
                    <SelectValue placeholder="Discipline" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {disciplineOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="bg-white text-black">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            );
          }
          if (col === "ElementType") {
            return (
              <TableCell key={col}>
                <Select
                  value={row[col] || ""}
                  onValueChange={(val) => handleElementTypeChange(row, val)}
                >
                  <SelectTrigger className="h-8 text-sm" onMouseDown={(e) => e.stopPropagation()}>
                    <SelectValue placeholder="Element Type">
                      {row[col] && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getElementTypeColor(row[col]) }}
                          />
                          <span>{row[col]}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {elementtype.map((type) => {
                      const c = elementTypeColorMap[type] || fallbackTypeColor;
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                            <span>{type}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </TableCell>
            );
          }
          if (numericColumns.includes(col.toUpperCase())) {
            let val = row[col] || "";
            if (isDimensionsView && val !== "") {
              const floatVal = parseFloat(val);
              if (!isNaN(floatVal)) {
                val = floatVal.toFixed(2);
              }
            }
            return (
              <TableCell key={col}>
                <Input
                  type="text"
                  name={col}
                  value={val}
                  onChange={(e) => handleInputChange(row, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="h-8 text-sm"
                />
              </TableCell>
            );
          }
          return (
            <TableCell key={col}>
              <Input
                type="text"
                name={col}
                value={row[col] || ""}
                onChange={(e) => handleInputChange(row, e)}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-8 text-sm"
              />
            </TableCell>
          );
        })}
        <TableCell className="text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (row.dbId) isolateRow(row.dbId);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Isolate element</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      </TableRow>
    );
  });
  
  const PartialTotalsRow = React.memo(({ discipline, visibleColumns, totalsByDiscipline }: any) => {
    const formatTotal = useCallback((col: string, val: any) => {
      if (!numericColumns.includes(col.toUpperCase())) return "";
      if (val == null || val === "") return "";
      const num = parseFloat(val).toFixed(2);
      switch (col.toUpperCase()) {
        case "LENGTH": case "WIDTH": case "HEIGHT": case "PERIMETER": case "THICKNESS":
          return `${num} m`;
        case "AREA": return `${num} m²`;
        case "VOLUME": return `${num} m³`;
        default: return num;
      }
    }, []);
  
    return (
      <TableRow className={"text-sm text-black font-bold bg-gray-100"}>
        {visibleColumns.map((col: string, idx: number) => {
          if (idx === 0) return <TableCell key="partial-label" className="normal-case">Partial Totals</TableCell>;
          const val = totalsByDiscipline?.[discipline]?.[col] ?? 0;
          return <TableCell key={col}>{formatTotal(col, val)}</TableCell>;
        })}
        <TableCell />
      </TableRow>
    );
  });
  
  const GrandTotalsRow = React.memo(({ visibleColumns, grandTotals }: any) => {
    const formatTotal = useCallback((col: string, val: any) => {
      if (!numericColumns.includes(col.toUpperCase())) return "";
      if (val == null || val === "") return "";
      const num = parseFloat(val).toFixed(2);
      switch (col.toUpperCase()) {
        case "LENGTH": case "WIDTH": case "HEIGHT": case "PERIMETER": case "THICKNESS":
          return `${num} m`;
        case "AREA": return `${num} m²`;
        case "VOLUME": return `${num} m³`;
        default: return num;
      }
    }, []);
  
    return (
      <TableRow className="bg-slate-200 font-bold">
        {visibleColumns.map((col: string, idx: number) => {
          if (idx === 0) return <TableCell key="grand-label">Grand Totals</TableCell>;
          const val = grandTotals?.[col] ?? 0;
          return <TableCell key={col}>{formatTotal(col, val)}</TableCell>;
        })}
        <TableCell />
      </TableRow>
    );
  });
  
  /** 5) TableControls */
  interface TableControlsProps {
    activeSection: string;
    handleChangeSection: (val: string) => void;
    handleExpandAll: () => void;
    handleCollapseAll: () => void;
    searchDbId: string;
    setSearchDbId: (val: string) => void;
    handleDbIdSearch: () => void;
    filterText: string;
    setFilterText: (val: string) => void;
    page: number;
    totalPages: number;
    handlePrevPage: () => void;
    handleNextPage: () => void;
    handleFirstPage: () => void;
    handleLastPage: () => void;
  }
  
  const TableControls = React.memo(({
    activeSection,
    handleChangeSection,
    handleExpandAll,
    handleCollapseAll,
    searchDbId,
    setSearchDbId,
    handleDbIdSearch,
    filterText,
    setFilterText,
    page,
    totalPages,
    handlePrevPage,
    handleNextPage,
    handleFirstPage,
    handleLastPage,
  }: TableControlsProps) => {
    return (
      <div className="space-y-2 bg-white p-4 border-b">
        <div className="flex flex-wrap gap-2 justify-between">
          {/* Izquierda */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExpandAll} className="flex items-center gap-1 bg-gray-200 text-black shadow-sm hover:bg-[#2ea3e3] hover:text-white">
              <ChevronDown className="h-4 w-4" /> Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={handleCollapseAll} className="flex items-center gap-1 bg-gray-200 text-black shadow-sm hover:bg-[#2ea3e3] hover:text-white">
              <ChevronRight className="h-4 w-4" /> Collapse All
            </Button>
          </div>
  
          {/* Centro */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFirstPage} disabled={page <= 1}>
                <ChevronFirst className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevPage} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs px-2">
                Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextPage} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleLastPage} disabled={page >= totalPages}>
                <ChevronLast className="h-4 w-4" />
              </Button>
            </div>
          </div>
  
          {/* Derecha */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="Search dbId..."
                value={searchDbId}
                onChange={(e) => setSearchDbId(e.target.value)}
                className="w-28 h-8 text-xs pr-8"
                onKeyDown={(e) => { if (e.key === "Enter") handleDbIdSearch(); }}
              />
              <Button size="sm" variant="ghost" className="absolute right-0 h-8 w-8 p-0" onClick={handleDbIdSearch}>
                <Search className="h-3 w-3" />
              </Button>
            </div>
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="Filter TypeName / Desc..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-44 h-8 text-xs pr-8"
              />
              <Filter className="h-3 w-3 absolute right-2 text-muted-foreground" />
            </div>
          </div>
        </div>
  
        {/* Tabs */}
        <Tabs value={activeSection} onValueChange={handleChangeSection} className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-gray-100">
            {["general", "dimensions", "description", "schedule"].map((sec) => (
              <TabsTrigger
                key={sec}
                value={sec}
                className="bg-gray-100 text-black shadow-sm data-[state=active]:bg-[#2ea3e3] data-[state=active]:text-white capitalize"
              >
                {sec}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    );
  });
  
  /** =============== MAIN COMPONENT =============== */
  
  interface Database4DTableProps {
    data: IRowData[];
    viewer: any;
    totalsByDiscipline: any;
    grandTotals: any;
    handleInputChange: (row: IRowData, e: ChangeEvent<HTMLInputElement>) => void;
    handleDisciplineChange: (row: IRowData, val: string) => void;
    handleElementTypeChange: (row: IRowData, val: string) => void;
    disciplineOptions: string[];
    elementtype: string[];
    isolateObjectsInViewer: (viewer: any, dbIds: string[]) => void;
    hideObjectsInViewer: (viewer: any, dbIds: string[]) => void;
    collapsedDisciplines: Record<string, boolean>;
    setCollapsedDisciplines: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    selectedRows: string[]; // dbIds
    setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
    lastClickedRowNumber: number | null;
    setLastClickedRowNumber: React.Dispatch<React.SetStateAction<number | null>>;
    onVisibleColumnsChange?: (cols: string[]) => void;
  }
  
  function Database4DTable({
    data,
    totalsByDiscipline,
    grandTotals,
    handleInputChange,
    handleDisciplineChange,
    handleElementTypeChange,
    disciplineOptions,
    elementtype,
    isolateObjectsInViewer,
    hideObjectsInViewer,
    collapsedDisciplines,
    setCollapsedDisciplines,
    selectedRows,
    setSelectedRows,
    lastClickedRowNumber,
    setLastClickedRowNumber,
    onVisibleColumnsChange,
  }: Database4DTableProps) {
    const [loading, setLoading] = useState(false);
    const simulateLoading = useCallback((callback: () => void) => {
      setLoading(true);
      setTimeout(() => {
        if (typeof callback === "function") callback();
        setLoading(false);
      }, 300);
    }, []);
  
    const [activeSection, setActiveSection] = useState("general");
    const isDimensionsView = activeSection === "dimensions";
    const [page, setPage] = useState(1);
    const perPage = 250;
    const hoverColor = "bg-slate-100";
    const [filterText, setFilterText] = useState("");
    const [sortDisciplinesAsc, setSortDisciplinesAsc] = useState(false);
  
    const handleExpandAll = useCallback(() => {
      const newState: Record<string, boolean> = {};
      const allDisciplines = [...new Set(data.map((r) => r.Discipline || "No Discipline"))];
      allDisciplines.forEach((d) => { newState[d] = false; });
      setCollapsedDisciplines(newState);
    }, [setCollapsedDisciplines, data]);
  
    const handleCollapseAll = useCallback(() => {
      const newState: Record<string, boolean> = {};
      const allDisciplines = [...new Set(data.map((r) => r.Discipline || "No Discipline"))];
      allDisciplines.forEach((d) => { newState[d] = true; });
      setCollapsedDisciplines(newState);
    }, [setCollapsedDisciplines, data]);
  
    const filteredData = useMemo(() => {
      if (!data) return [];
      if (!filterText.trim()) return data;
      const lowerFilter = filterText.toLowerCase();
      return data.filter((row) => {
        const typeName = row.TypeName?.toLowerCase() || "";
        const desc = row.Description?.toLowerCase() || "";
        return typeName.includes(lowerFilter) || desc.includes(lowerFilter);
      });
    }, [data, filterText]);
  
    const groupedData = useMemo(() => {
      if (!filteredData) return {};
      const grouped = filteredData.reduce((acc: Record<string, IRowData[]>, row) => {
        const disc = row.Discipline || "No Discipline";
        if (!acc[disc]) acc[disc] = [];
        acc[disc].push(row);
        return acc;
      }, {});
      return grouped;
    }, [filteredData]);
  
    const displayRows = useMemo(() => {
      if (!groupedData) return [];
      const result: any[] = [];
      Object.entries(groupedData).forEach(([disc, rows]) => {
        result.push({ type: "header", disc, count: rows.length });
        if (!collapsedDisciplines[disc]) {
          rows.forEach((row, idx) => {
            result.push({ type: "element", row, idx, disc });
          });
          result.push({ type: "partialTotals", disc });
        }
      });
      return result;
    }, [groupedData, collapsedDisciplines]);
  
    const totalPages = useMemo(() => {
      return Math.max(1, Math.ceil(displayRows.length / perPage));
    }, [displayRows, perPage]);
  
    const paginatedRows = useMemo(() => {
      const startIndex = (page - 1) * perPage;
      return displayRows.slice(startIndex, startIndex + perPage);
    }, [displayRows, page, perPage]);
  
    const [searchDbId, setSearchDbId] = useState("");
    
  
    const handleDbIdSearch = useCallback(() => {
        const numericSearch = parseInt(searchDbId, 10);
        if (isNaN(numericSearch)) return;
      
        const found = data.find((r) => parseInt(r.dbId!, 10) === numericSearch);
      
        if (found && found.dbId) {
          setSelectedRows([found.dbId]);
          // Cambio para Sonner:
          toast.success("Element found", {
            description: `DbId ${searchDbId} highlighted`,
          });
        } else {
          setSelectedRows([]);
          // Cambio para Sonner:
          toast.error("Element not found", {
            description: `DbId ${searchDbId} not found`,
          });
        }
      }, [searchDbId, data, setSelectedRows]);
  
    const isRowSelected = useCallback((dbId: string) => selectedRows.includes(dbId), [selectedRows]);
  
    const handleRowClick = useCallback((row: IRowData, e: React.MouseEvent, indexInDiscipline: number) => {
      const target = e.target as HTMLElement;
      const interactiveTags = ["INPUT", "SELECT", "BUTTON", "TEXTAREA"];
      if (interactiveTags.includes(target.tagName)) return;
  
      const rowNum = row.rowNumber ?? indexInDiscipline + 1;
      if (e.shiftKey && lastClickedRowNumber !== null) {
        const minRow = Math.min(lastClickedRowNumber, rowNum);
        const maxRow = Math.max(lastClickedRowNumber, rowNum);
        const newSelectedDbIds = data
          .filter((item) => {
            const itemRowNum = item.rowNumber ?? 0;
            return itemRowNum >= minRow && itemRowNum <= maxRow;
          })
          .map((item) => item.dbId!);
        setSelectedRows(newSelectedDbIds);
      } else {
        if (row.dbId) {
          setSelectedRows([row.dbId]);
          setLastClickedRowNumber(rowNum);
        }
      }
    }, [data, lastClickedRowNumber, setSelectedRows, setLastClickedRowNumber]);
  
    const toggleDiscipline = useCallback((disc: string) => {
      simulateLoading(() => {
        setCollapsedDisciplines((prev) => ({ ...prev, [disc]: !prev[disc] }));
      });
    }, [simulateLoading, setCollapsedDisciplines]);
  
    const isolateDiscipline = useCallback((rows: IRowData[]) => {
      isolateObjectsInViewer(window.data4Dviewer, rows.map((r) => r.dbId!));
    }, [isolateObjectsInViewer]);
  
    const hideDisciplineAction = useCallback((rows: IRowData[]) => {
      hideObjectsInViewer(window.data4Dviewer, rows.map((r) => r.dbId!));
    }, [hideObjectsInViewer]);
  
    const isolateRow = useCallback((dbId: string) => {
      isolateObjectsInViewer(window.data4Dviewer, [dbId]);
    }, [isolateObjectsInViewer]);
  
    const handleChangeSection = useCallback((section: string) => {
      simulateLoading(() => setActiveSection(section));
    }, [simulateLoading]);
  
    const handleNextPage = useCallback(() => {
      if (page < totalPages) simulateLoading(() => setPage((p) => p + 1));
    }, [page, totalPages, simulateLoading]);
  
    const handlePrevPage = useCallback(() => {
      if (page > 1) simulateLoading(() => setPage((p) => p - 1));
    }, [page, simulateLoading]);
  
    const handleFirstPage = useCallback(() => {
      if (page > 1) simulateLoading(() => setPage(1));
    }, [page, simulateLoading]);
  
    const handleLastPage = useCallback(() => {
      if (page < totalPages) simulateLoading(() => setPage(totalPages));
    }, [page, totalPages, simulateLoading]);
  
    const visibleColumns = columnGroups[activeSection] || [];
    useEffect(() => {
      if (typeof onVisibleColumnsChange === "function") {
        onVisibleColumnsChange(visibleColumns);
      }
    }, [visibleColumns, activeSection, onVisibleColumnsChange]);
  
    const tableContainerRef = useRef<HTMLDivElement>(null);
  
    return (
      <Card className="w-full shadow-lg border-0 h-full flex flex-col">
        <CardHeader className="bg-white py-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Model Data Table</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredData.length} elements • {Object.keys(groupedData).length} disciplines
          </div>
        </CardHeader>
  
        <TableControls
          activeSection={activeSection}
          handleChangeSection={handleChangeSection}
          handleExpandAll={handleExpandAll}
          handleCollapseAll={handleCollapseAll}
          searchDbId={searchDbId}
          setSearchDbId={setSearchDbId}
          handleDbIdSearch={handleDbIdSearch}
          filterText={filterText}
          setFilterText={setFilterText}
          page={page}
          totalPages={totalPages}
          handlePrevPage={handlePrevPage}
          handleNextPage={handleNextPage}
          handleFirstPage={handleFirstPage}
          handleLastPage={handleLastPage}
        />
  
        <CardContent className="p-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading data...</span>
              </div>
            </div>
          ) : (
            <div ref={tableContainerRef} className="h-full w-full overflow-y-auto" style={{ maxHeight: "100%" }}>
              <Table>
                <TableHeader className="text-sm bg-gray-100 sticky top-0 z-10">
                  <TableRow className="text-sm min-h-[48px]">
                    {visibleColumns.map((col) => (
                      <TableHead key={col} className="text-sm whitespace-normal font-bold">
                        {col === "rowNumber" ? "Row #" : col.replace(/([A-Z])/g, " $1").trim()}
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
  
                <TableBody>
                  {paginatedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <p>No results found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((item) => {
                      if (item.type === "header") {
                        return (
                          <DisciplineHeaderRow
                            key={`hdr-${item.disc}`}
                            discipline={item.disc}
                            rowsCount={item.count}
                            isDiscCollapsed={collapsedDisciplines[item.disc] || false}
                            visibleColsCount={visibleColumns.length}
                            onToggle={() => toggleDiscipline(item.disc)}
                            isolateDiscipline={() => isolateDiscipline(groupedData[item.disc])}
                            hideDiscipline={() => hideDisciplineAction(groupedData[item.disc])}
                          />
                        );
                      } else if (item.type === "element") {
                        return (
                          <ElementRow
                            key={`elm-${item.row.rowNumber}`}
                            row={item.row}
                            index={item.idx}
                            isSelected={isRowSelected(item.row.dbId!)}
                            visibleColumns={visibleColumns}
                            handleInputChange={handleInputChange}
                            handleDisciplineChange={handleDisciplineChange}
                            handleElementTypeChange={handleElementTypeChange}
                            disciplineOptions={disciplineOptions}
                            elementtype={elementtype}
                            isolateRow={isolateRow}
                            onRowClick={(e) => handleRowClick(item.row, e, item.idx)}
                            isDimensionsView={isDimensionsView}
                            hoverColor={hoverColor}
                          />
                        );
                      } else if (item.type === "partialTotals") {
                        return (
                          <PartialTotalsRow
                            key={`partial-${item.disc}`}
                            discipline={item.disc}
                            visibleColumns={visibleColumns}
                            totalsByDiscipline={totalsByDiscipline}
                          />
                        );
                      }
                      return null;
                    })
                  )}
                </TableBody>
  
                <TableHeader className="bg-slate-200 sticky bottom-0 z-10">
                  <GrandTotalsRow visibleColumns={visibleColumns} grandTotals={grandTotals} />
                </TableHeader>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  export default React.memo(Database4DTable);