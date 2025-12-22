import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Home, LayoutGrid, Users, ClipboardList, Mail, FileText, Layers,
  DollarSign, Wrench, FileCode, ClipboardCheck, Clock, HardDrive,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function HubSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { accountId, projectId } = useParams();
  const location = useLocation();

  // Si no hay projectId, probablemente estamos en la lista de proyectos y el sidebar puede cambiar o ocultarse.
  // Por ahora asumiremos que se muestra.

  const menuItems = [
    { icon: <Home className="h-5 w-5" />, label: "Home Projects", path: "/accprojects" },
    { icon: <LayoutGrid className="h-5 w-5" />, label: "Project Dashboard", path: `/accprojects/${accountId}/${projectId}` },
    { icon: <Users className="h-5 w-5" />, label: "Users", path: `/accprojects/${accountId}/${projectId}/accusers` },
    { icon: <ClipboardList className="h-5 w-5" />, label: "Issues", path: `/accprojects/${accountId}/${projectId}/accissues` },
    { icon: <Mail className="h-5 w-5" />, label: "RFIs", path: `/accprojects/${accountId}/${projectId}/accrfis` },
    { icon: <FileText className="h-5 w-5" />, label: "Submittals", path: `/accprojects/${accountId}/${projectId}/accsubmittals` },
    // Agregué separadores lógicos en el renderizado en lugar de grupos estrictos para simplificar
    { icon: <Layers className="h-5 w-5" />, label: "4D Data", path: `/accprojects/${accountId}/${projectId}/acc4ddata` },
    { icon: <DollarSign className="h-5 w-5" />, label: "5D Data", path: `/accprojects/${accountId}/${projectId}/acc5ddata` },
    { icon: <Wrench className="h-5 w-5" />, label: "6D Data", path: `/accprojects/${accountId}/${projectId}/acc6ddata` },
    { icon: <FileCode className="h-5 w-5" />, label: "Plans", path: `/accprojects/${accountId}/${projectId}/plans` },
    { icon: <ClipboardCheck className="h-5 w-5" />, label: "Tasks", path: `/accprojects/${accountId}/${projectId}/task-manager` },
    { icon: <Clock className="h-5 w-5" />, label: "Time & Budget", path: `/accprojects/${accountId}/${projectId}/time-budget-management` },
    { icon: <HardDrive className="h-5 w-5" />, label: "LOD Checker", path: `/accprojects/${accountId}/${projectId}/lod-checker` },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-screen border-r bg-card text-card-foreground transition-all duration-300 ease-in-out z-20",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <div className="flex items-center justify-end p-4 h-16 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer Sidebar (Version/Help) */}
        {!collapsed && (
          <div className="p-4 border-t bg-muted/20 text-xs text-muted-foreground">
            <p>TAD HUB v1.0.0</p>
            <Link to="/contact" className="hover:text-primary transition-colors">Help & Support</Link>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}