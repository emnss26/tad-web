import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Box,
  HardDrive,
  Layers,
  Anchor,
  Zap,
  Cpu,
  Wrench,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DisciplineSidebarProps {
  selected: string;
  onSelect: (discipline: string) => void;
}

const DISCIPLINE_ITEMS = [
  { key: "Architecture", icon: <LayoutGrid className="h-4 w-4" /> },
  { key: "Exteriors", icon: <Box className="h-4 w-4" /> },
  { key: "Concrete Structure", icon: <HardDrive className="h-4 w-4" /> },
  { key: "Steel Structure", icon: <Layers className="h-4 w-4" /> },
  { key: "Plumbing Installation", icon: <Anchor className="h-4 w-4" /> },
  { key: "Electrical Installation", icon: <Zap className="h-4 w-4" /> },
  { key: "Special Systems", icon: <Cpu className="h-4 w-4" /> },
  { key: "Mechanical - HVAC", icon: <Wrench className="h-4 w-4" /> },
];

export function DisciplineSidebar({ selected, onSelect }: DisciplineSidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("lodSidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("lodSidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-[650px] flex-col border-r border-gray-200 bg-[#f6f6f6] p-4 transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((value) => !value)}
          className="mb-6 self-end"
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        >
          {collapsed ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>

        <div className="flex-1 space-y-2 overflow-auto">
          {DISCIPLINE_ITEMS.map(({ key, icon }) => {
            const active = selected === key;
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelect(key)}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-xs transition-all duration-200",
                      active
                        ? "bg-[#e6f4fa] font-medium text-[#2ea3e3]"
                        : "hover:bg-gray-200 hover:text-[#2ea3e3]"
                    )}
                  >
                    <span className={cn(active && "text-[#2ea3e3]")}>{icon}</span>
                    {!collapsed && <span className="truncate">{key}</span>}
                    {active && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-[#2ea3e3]" />}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{key}</TooltipContent>}
              </Tooltip>
            );
          })}
        </div>
      </aside>
    </TooltipProvider>
  );
}
