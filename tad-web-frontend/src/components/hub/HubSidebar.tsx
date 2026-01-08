import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Home, LayoutGrid, Users, ClipboardList, Mail, FileText, Layers,
  DollarSign, Wrench, FileCode, ClipboardCheck, Clock, HardDrive,
  ChevronLeft, ChevronRight, Building
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

  // 1. Detectar Plataforma
  const isAcc = location.pathname.includes("/accprojects");
  const platformPrefix = isAcc ? "/accprojects" : "/bim360projects";

  // 2. Definir Menús Específicos
  
  // Menú Común (Base)
  const commonItems = [
    { icon: <LayoutGrid className="h-5 w-5" />, label: "Dashboard", path: `${platformPrefix}/${accountId}/${projectId}` },
    { icon: <Users className="h-5 w-5" />, label: "Users", path: `${platformPrefix}/${accountId}/${projectId}/users` },
    { icon: <ClipboardList className="h-5 w-5" />, label: "Issues", path: `${platformPrefix}/${accountId}/${projectId}/issues` },
    { icon: <Mail className="h-5 w-5" />, label: "RFIs", path: `${platformPrefix}/${accountId}/${projectId}/rfis` },
  ];

  // Items exclusivos de ACC
  const accItems = [
    { icon: <FileText className="h-5 w-5" />, label: "Submittals", path: `${platformPrefix}/${accountId}/${projectId}/submittals` },
    // Aquí irían los otros módulos exclusivos cuando estén listos (4D, 5D, etc)
    { icon: <Layers className="h-5 w-5" />, label: "4D Data", path: `${platformPrefix}/${accountId}/${projectId}/acc4ddata` },
    { icon: <DollarSign className="h-5 w-5" />, label: "5D Data", path: `${platformPrefix}/${accountId}/${projectId}/acc5ddata` },
  ];

  // Items exclusivos de BIM360 (Si hubiera, por ahora solo el base)
  const bim360Items: any[] = [
      // Ejemplo: { icon: <Building />, label: "Classic Plans", path: ... }
  ];

  // 3. Fusionar Menú según plataforma
  const menuItems = [
      // Link de retorno a la lista de proyectos
      { icon: <Home className="h-5 w-5" />, label: "All Projects", path: platformPrefix }, 
      
      ...(isAcc ? [...commonItems, ...accItems] : [...commonItems, ...bim360Items]),
      
      // Herramientas Comunes (Planos, Tareas, LOD) - Asumo que quieres que estén en ambos por ahora
      // Si alguno no aplica a BIM360, muévelo al array accItems
      { icon: <FileCode className="h-5 w-5" />, label: "Plans", path: `${platformPrefix}/${accountId}/${projectId}/plans` },
      { icon: <ClipboardCheck className="h-5 w-5" />, label: "Tasks", path: `${platformPrefix}/${accountId}/${projectId}/task-manager` },
      { icon: <HardDrive className="h-5 w-5" />, label: "LOD Checker", path: `${platformPrefix}/${accountId}/${projectId}/lod-checker` },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-full bg-card text-card-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <div className="flex items-center justify-end p-4 h-14 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 ml-auto hover:bg-muted"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Platform Badge (Visual Helper) */}
        {!collapsed && (
            <div className="px-4 py-2">
                <div className={cn(
                    "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full text-center",
                    isAcc ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700"
                )}>
                    {isAcc ? "Autodesk Build" : "BIM 360"}
                </div>
            </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-hide">
          {menuItems.map((item, index) => {
            // Lógica exacta de active (match exacto o subrutas)
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium group relative overflow-hidden",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    {/* Barra indicadora activa */}
                    {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    )}
                    
                    <span className={cn(isActive ? "text-primary" : "group-hover:scale-110 transition-transform")}>
                        {item.icon}
                    </span>
                    
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-popover text-popover-foreground ml-2 font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        {!collapsed && (
          <div className="p-4 border-t bg-muted/10 text-xs text-muted-foreground text-center">
            <p className="font-semibold mb-1">TAD HUB v2.0</p>
            <Link to="/contact" className="hover:text-primary transition-colors underline">Support</Link>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}