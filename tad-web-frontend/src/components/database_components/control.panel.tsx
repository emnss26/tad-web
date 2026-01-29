import React, { useState, useRef, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Table as TableIcon,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Send,
  Database,
  RefreshCw,
  Settings,
  Minimize,
  Maximize,
  Palette,
  ChevronDown,
  Link,
  Link2Off,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Asumimos que este componente existe o lo crearás en la misma carpeta
import EnhancedColorPicker from "./color.selector";

interface ControlPanelProps {
  viewer: any;
  showViewer: boolean;
  toggleViewer: () => void;
  showAIpanel: boolean;
  setAIpanel: (val: boolean) => void;
  syncViewerSelection: boolean;
  setSyncViewerSelection: React.Dispatch<React.SetStateAction<boolean>>;
  resetViewerView: (viewer: any) => void;
  showAllObjects: (viewer: any) => void;

  handleAddRow: () => void;
  handleRemoveRow: (index: number) => void; // Ajustado según useTableControls
  handleSubmit: () => void;
  handlePullData: (discipline: string | null) => void;

  disciplineOptions: string[];
  selectedDisciplineForColor: string;
  setSelectedDisciplineForColor: (val: string) => void;
  selectedColor: string;
  setSelectedColor: (val: string) => void;
  handleApplyColorToDiscipline: () => void;

  customTableName?: string;
  setCustomTableName?: (val: string) => void;
  handleAddCustomRow?: () => void;
  handleRemoveCustomRow?: () => void;
  handleSubmitCustomTable?: () => void;
  handlePullCustomTableData?: () => void;
}

export default function ControlPanel({
  viewer,
  showViewer,
  toggleViewer,
  showAIpanel,
  setAIpanel,
  syncViewerSelection,
  setSyncViewerSelection,
  resetViewerView,
  showAllObjects,

  handleAddRow,
  handleRemoveRow,
  handleSubmit,
  handlePullData,

  disciplineOptions,
  selectedDisciplineForColor,
  setSelectedDisciplineForColor,
  selectedColor,
  setSelectedColor,
  handleApplyColorToDiscipline,

  customTableName = "",
  setCustomTableName = () => {},
  handleAddCustomRow = () => {},
  handleRemoveCustomRow = () => {},
  handleSubmitCustomTable = () => {},
  handlePullCustomTableData = () => {},
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState("viewer");
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isPickerOpen &&
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        // Importante: Verifica si el clic no fue dentro del portal del SketchPicker
        // si el SketchPicker está fuera del árbol del ref.
        setIsPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside as any);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as any);
    };
  }, [isPickerOpen]);

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden w-full"
    >
      {/* Encabezado del Panel */}
      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-m">Control Center</h3>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                >
                  {isPanelExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isPanelExpanded ? "Collapse panel" : "Expand panel"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Contenido del Panel */}
      <AnimatePresence>
        {isPanelExpanded && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tabs Superior */}
              <div className="px-4 pt-3">
                <TabsList className="grid grid-cols-3 w-full bg-white">
                  <TabsTrigger
                    value="viewer"
                    className="flex items-center gap-2 bg-gray-300 text-gray-600 p-2 rounded-md transition-colors hover:bg-[#2ea3e3] hover:text-white"
                  >
                    <Layers className="h-4 w-4" />
                    <span>Viewer Controls</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="flex items-center gap-2 bg-gray-300 text-gray-600 p-2 rounded-md transition-colors hover:bg-[#2ea3e3] hover:text-white"
                  >
                    <TableIcon className="h-4 w-4" />
                    <span>Table Controls</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="flex items-center gap-2 bg-gray-300 text-gray-600 p-2 rounded-md transition-colors hover:bg-[#2ea3e3] hover:text-white"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Custom Tables</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Contenido - VIEWER */}
              <TabsContent value="viewer" className="p-4">
                <Card className="border-none shadow-none">
                  <CardContent className="p-0 space-y-4">
                    {/* Primera fila de botones */}
                    <div className="grid grid-cols-4 gap-3">
                      <Button
                        variant="default"
                        onClick={() => showAllObjects(viewer)}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Show All</span>
                      </Button>
                      <Button
                        variant="default"
                        onClick={toggleViewer}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        {showViewer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span>{showViewer ? "Hide Viewer" : "Show Viewer"}</span>
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => setAIpanel(!showAIpanel)}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <Settings className="h-4 w-4" />
                        <span>{showAIpanel ? "Hide AI" : "Show AI"}</span>
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => resetViewerView(viewer)}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Reset Viewer</span>
                      </Button>
                    </div>

                    {/* Segunda fila en Viewer */}
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      <div className="col-span-1">
                        <Button
                          variant="default"
                          onClick={() => setSyncViewerSelection((prev) => !prev)}
                          className="w-full flex items-center justify-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                        >
                          {syncViewerSelection ? <Link className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
                          <span>{syncViewerSelection ? "No Real Time Selection" : "Real Time Selection"}</span>
                        </Button>
                      </div>
                      <div className="col-span-3 flex items-center gap-2 bg-muted/40 rounded-md p-2">
                        <Palette className="h-4 w-4 text-muted-foreground ml-1" />
                        <Select value={selectedDisciplineForColor} onValueChange={setSelectedDisciplineForColor}>
                          <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0 focus-visible:ring-0">
                            <SelectValue placeholder="Select discipline" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {disciplineOptions.map((disc) => (
                              <SelectItem
                                key={disc}
                                value={disc}
                                className="data-[state=highlighted]:bg-gray-200 data-[highlighted]:bg-[#2ea3e3] data-[highlighted]:text-white"
                              >
                                {disc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <EnhancedColorPicker
                          selectedColor={selectedColor}
                          setSelectedColor={setSelectedColor}
                          isPickerOpen={isPickerOpen}
                          setIsPickerOpen={setIsPickerOpen}
                          pickerRef={colorPickerRef}
                        />
                        
                        <Button
                          variant="secondary"
                          onClick={handleApplyColorToDiscipline}
                          className="h-8"
                          size="sm"
                          disabled={!selectedDisciplineForColor}
                        >
                          Apply Color
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contenido - TABLE */}
              <TabsContent value="table" className="p-4">
                <Card className="border-none shadow-none">
                  <CardContent className="p-0 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="default"
                        onClick={handleAddRow}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Row</span>
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => handleRemoveRow(-1)} // -1 o lógica para eliminar selección
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Row</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <Button
                        variant="default"
                        onClick={handleSubmit}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                        <span>Send Data</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 bg-white text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm">
                              <Database className="h-4 w-4" />
                              <span>Pull Data</span>
                            </div>
                            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white max-h-60 overflow-y-auto">
                          <DropdownMenuItem
                            onClick={() => handlePullData(null)}
                            className="data-[state=highlighted]:bg-[#2ea3e3] data-[highlighted]:bg-[#2ea3e3] data-[highlighted]:text-white"
                          >
                            All Disciplines
                          </DropdownMenuItem>
                          <Separator className="my-1" />
                          {disciplineOptions.map((discipline) => (
                            <DropdownMenuItem
                              key={discipline}
                              onClick={() => handlePullData(discipline)}
                              className="data-[state=highlighted]:bg-[#2ea3e3] data-[highlighted]:bg-[#2ea3e3] data-[highlighted]:text-white"
                            >
                              {discipline}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contenido - CUSTOM TABLES */}
              <TabsContent value="custom" className="p-4">
                <Card className="border-none shadow-none">
                  <CardContent className="p-0 space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <Input
                          placeholder="Custom Table Name"
                          value={customTableName}
                          onChange={(e) => setCustomTableName(e.target.value)}
                        />
                      </div>
                      <Button
                        variant="default"
                        onClick={handleAddCustomRow}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Row</span>
                      </Button>
                      <Button
                        variant="default"
                        onClick={handleRemoveCustomRow}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Row</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="default"
                        onClick={handleSubmitCustomTable}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                        <span>Send Custom Table Data</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handlePullCustomTableData}
                        className="flex items-center gap-2 bg-gray-200 text-black hover:bg-[#2ea3e3] hover:text-white rounded shadow-sm"
                      >
                        <Database className="h-4 w-4" />
                        <span>Pull Custom Table Data</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
}