import { useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  Users,
  ClipboardList,
  Mail,
  FileText,
  Layers,
  DollarSign,
  FileCode,
  ClipboardCheck,
  Clock,
  HardDrive,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type MatchMode = "exact" | "prefix";

interface SidebarItem {
  icon: ReactNode;
  label: string;
  path: string;
  match?: MatchMode;
}

const normalizePath = (path: string) => {
  const cleaned = String(path || "").replace(/\/+$/, "");
  return cleaned || "/";
};

export function HubSidebar() {
  const { accountId, projectId } = useParams();
  const location = useLocation();
  const isAcc = location.pathname.includes("/accprojects");
  const platformPrefix = isAcc ? "/accprojects" : "/bim360projects";
  const [isCollapsed, setIsCollapsed] = useState(true);

  const commonItems: SidebarItem[] = [
    {
      icon: <LayoutGrid className="h-5 w-5" />,
      label: "Dashboard",
      path: `${platformPrefix}/${accountId}/${projectId}`,
      match: "exact",
    },
    { icon: <Users className="h-5 w-5" />, label: "Users", path: `${platformPrefix}/${accountId}/${projectId}/users` },
    { icon: <ClipboardList className="h-5 w-5" />, label: "Issues", path: `${platformPrefix}/${accountId}/${projectId}/issues` },
    { icon: <Mail className="h-5 w-5" />, label: "RFIs", path: `${platformPrefix}/${accountId}/${projectId}/rfis` },
  ];

  const accItems: SidebarItem[] = [
    { icon: <FileText className="h-5 w-5" />, label: "Submittals", path: `${platformPrefix}/${accountId}/${projectId}/submittals` },
    { icon: <Layers className="h-5 w-5" />, label: "4D Data", path: `${platformPrefix}/${accountId}/${projectId}/acc4ddata` },
    { icon: <DollarSign className="h-5 w-5" />, label: "5D Data", path: `${platformPrefix}/${accountId}/${projectId}/acc5ddata` },
    { icon: <Layers className="h-5 w-5" />, label: "6D Data", path: `${platformPrefix}/${accountId}/${projectId}/acc6ddata` },
  ];

  const bim360Items: SidebarItem[] = [
    { icon: <Layers className="h-5 w-5" />, label: "4D Data", path: `${platformPrefix}/${accountId}/${projectId}/b3604ddata` },
    { icon: <DollarSign className="h-5 w-5" />, label: "5D Data", path: `${platformPrefix}/${accountId}/${projectId}/b3605ddata` },
    { icon: <Layers className="h-5 w-5" />, label: "6D Data", path: `${platformPrefix}/${accountId}/${projectId}/b3606ddata` },
  ];

  const menuItems: SidebarItem[] = [
    { icon: <Home className="h-5 w-5" />, label: "All Projects", path: platformPrefix, match: "exact" },
    ...(isAcc ? [...commonItems, ...accItems] : [...commonItems, ...bim360Items]),
    { icon: <FileCode className="h-5 w-5" />, label: "Plans", path: `${platformPrefix}/${accountId}/${projectId}/plans` },
    { icon: <ClipboardCheck className="h-5 w-5" />, label: "Tasks", path: `${platformPrefix}/${accountId}/${projectId}/task-manager` },
    { icon: <HardDrive className="h-5 w-5" />, label: "LOD Checker", path: `${platformPrefix}/${accountId}/${projectId}/lod-checker` },
    {
      icon: <Building className="h-5 w-5" />,
      label: "Parameters Checker",
      path: `${platformPrefix}/${accountId}/${projectId}/aec-parameter-checker`,
    },
    {
      icon: <Layers className="h-5 w-5" />,
      label: "Project 4D WBS Planner",
      path: `${platformPrefix}/${accountId}/${projectId}/aec-wbs-planner`,
    },
    { icon: <Clock className="h-5 w-5" />, label: "VR", path: `${platformPrefix}/${accountId}/${projectId}/vr` },
  ];

  const isItemActive = (item: SidebarItem) => {
    const currentPath = normalizePath(location.pathname);
    const itemPath = normalizePath(item.path);
    if ((item.match || "prefix") === "exact") {
      return currentPath === itemPath;
    }
    return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-full bg-card text-card-foreground transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center p-3 h-14 border-b">
          <div className={cn("flex items-center gap-2", isCollapsed ? "justify-center w-full" : "")}>
            <span
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                isAcc ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700"
              )}
            >
              {isAcc ? "AB" : "360"}
            </span>
            {!isCollapsed ? (
              <span className="text-xs font-semibold text-slate-600">{isAcc ? "Autodesk Construction Cloud" : "BIM 360"}</span>
            ) : null}
          </div>
        </div>

        <nav className={cn("flex-1 overflow-y-auto py-4 space-y-1 scrollbar-hide", isCollapsed ? "px-2" : "px-3")}>
          {menuItems.map((item) => {
            const isActive = isItemActive(item);
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 rounded-md transition-all duration-200 text-sm font-medium group relative overflow-hidden",
                      isCollapsed ? "justify-center" : "justify-start",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {isActive ? (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    ) : null}
                    <span className={cn(isActive ? "text-primary" : "group-hover:scale-110 transition-transform")}>
                      {item.icon}
                    </span>
                    {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                </TooltipTrigger>
                {isCollapsed ? (
                  <TooltipContent side="right" className="bg-popover text-popover-foreground ml-2 font-medium">
                    {item.label}
                  </TooltipContent>
                ) : null}
              </Tooltip>
            );
          })}
        </nav>

        <div className={cn("border-t py-2", isCollapsed ? "px-2" : "px-3")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setIsCollapsed((prev) => !prev)}
                className={cn(
                  "w-full rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 flex items-center",
                  isCollapsed ? "justify-center" : "justify-end"
                )}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            {isCollapsed ? (
              <TooltipContent side="right" className="bg-popover text-popover-foreground ml-2 font-medium">
                Expand sidebar
              </TooltipContent>
            ) : null}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
