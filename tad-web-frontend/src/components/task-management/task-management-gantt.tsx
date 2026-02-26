import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInDays,
  format,
  isWeekend,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TaskItem } from "./task.types";

interface TaskManagementGanttProps {
  tasks: TaskItem[];
}

const userColorMap = new Map<string, string>();

function generatePastelColor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 45 + (Math.abs(hash) % 25);
  const lightness = 75 + (Math.abs(hash) % 15);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getUserColor(seed: string): string {
  if (!userColorMap.has(seed)) {
    userColorMap.set(seed, generatePastelColor(seed));
  }
  return userColorMap.get(seed)!;
}

export function TaskManagementGantt({ tasks = [] }: TaskManagementGanttProps) {
  const [windowStart, setWindowStart] = useState(() => startOfDay(new Date()));
  const [windowSize, setWindowSize] = useState(28);
  const [dayWidth, setDayWidth] = useState(40);

  const taskBounds = useMemo(() => {
    if (!tasks.length) return null;

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    tasks.forEach((task) => {
      if (!task.startDate || !task.endDate) return;
      const start = startOfDay(parseISO(task.startDate));
      const end = startOfDay(parseISO(task.endDate));

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

      if (!minDate || start < minDate) minDate = start;
      if (!maxDate || end > maxDate) maxDate = end;
    });

    return minDate && maxDate ? { minDate, maxDate } : null;
  }, [tasks]);

  useEffect(() => {
    if (!taskBounds) return;

    const totalDays = differenceInDays(taskBounds.maxDate, taskBounds.minDate) + 1;
    const paddedStart = subDays(taskBounds.minDate, 3);

    setWindowStart(paddedStart);
    setWindowSize(Math.max(totalDays + 6, 14));
  }, [taskBounds]);

  const visibleDays = useMemo(() => {
    const days: Date[] = [];
    for (let index = 0; index < windowSize; index += 1) {
      days.push(addDays(windowStart, index));
    }
    return days;
  }, [windowSize, windowStart]);

  const getBarStyle = (task: TaskItem) => {
    if (!task.startDate || !task.endDate) return { display: "none" as const };

    const taskStart = startOfDay(parseISO(task.startDate));
    const taskEnd = startOfDay(parseISO(task.endDate));

    if (Number.isNaN(taskStart.getTime()) || Number.isNaN(taskEnd.getTime())) {
      return { display: "none" as const };
    }

    const windowEnd = addDays(windowStart, windowSize - 1);
    const visibleStart = taskStart < windowStart ? windowStart : taskStart;
    const visibleEnd = taskEnd > windowEnd ? windowEnd : taskEnd;

    if (visibleStart > windowEnd || visibleEnd < windowStart) {
      return { display: "none" as const };
    }

    const offsetDays = differenceInDays(visibleStart, windowStart);
    const spanDays = differenceInDays(visibleEnd, visibleStart) + 1;

    return {
      left: `${(offsetDays / windowSize) * 100}%`,
      width: `${(spanDays / windowSize) * 100}%`,
      backgroundColor: getUserColor(task.assignedTo || task.id),
      display: "block" as const,
    };
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -7 : 7;
    setWindowStart((current) => addDays(current, days));
  };

  const goToToday = () => {
    setWindowStart(startOfDay(new Date()));
  };

  const fitAllTasks = () => {
    if (!taskBounds) return;
    const totalDays = differenceInDays(taskBounds.maxDate, taskBounds.minDate) + 1;
    const paddedStart = subDays(taskBounds.minDate, 3);

    setWindowStart(paddedStart);
    setWindowSize(Math.max(totalDays + 6, 14));
  };

  const adjustZoom = (direction: "in" | "out") => {
    if (direction === "in") {
      setDayWidth((width) => Math.min(width + 10, 80));
      setWindowSize((size) => Math.max(size - 7, 14));
      return;
    }

    setDayWidth((width) => Math.max(width - 10, 20));
    setWindowSize((size) => Math.min(size + 7, 60));
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Diagrama de Gantt</h3>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")} disabled={!taskBounds}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={goToToday}>
              <Calendar className="mr-1 h-4 w-4" />
              Hoy
            </Button>

            <Button variant="outline" size="sm" onClick={() => navigateWeek("next")} disabled={!taskBounds}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={fitAllTasks} disabled={!taskBounds}>
              Ver todo
            </Button>

            <Button variant="outline" size="sm" onClick={() => adjustZoom("out")}>
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={() => adjustZoom("in")}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <div className="min-w-full" style={{ minWidth: `${200 + windowSize * dayWidth}px` }}>
          <div className="sticky top-0 z-10 flex border-b bg-gray-50">
            <div className="w-[200px] border-r bg-white p-3 font-medium">Tarea</div>

            <div className="flex flex-1">
              {visibleDays.map((day, index) => (
                <div
                  key={`${day.toISOString()}-${index}`}
                  className={cn(
                    "flex-shrink-0 border-r px-1 py-2 text-center text-xs",
                    isWeekend(day) ? "bg-gray-100" : "bg-gray-50"
                  )}
                  style={{ width: `${dayWidth}px` }}
                >
                  <div className="font-medium">{format(day, "EEE", { locale: es })}</div>
                  <div className="text-gray-600">{format(day, "d")}</div>
                  <div className="text-[10px] text-gray-500">{format(day, "MMM", { locale: es })}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {tasks.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-gray-500">No tasks to display</div>
            ) : (
              tasks.map((task) => {
                const barStyle = getBarStyle(task);

                return (
                  <div
                    key={task.id}
                    className="flex h-12 items-center border-b transition-colors hover:bg-gray-50"
                  >
                    <div className="w-[200px] border-r p-3">
                      <div className="truncate text-sm font-medium">{task.title}</div>
                    </div>

                    <div className="relative flex-1" style={{ height: "48px" }}>
                      <div className="absolute inset-0 flex">
                        {visibleDays.map((day) => (
                          <div
                            key={`grid-${day.toISOString()}-${task.id}`}
                            className="flex-shrink-0 border-r border-gray-100"
                            style={{ width: `${dayWidth}px` }}
                          />
                        ))}
                      </div>

                      {barStyle.display === "block" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute flex min-w-[8px] cursor-pointer items-center justify-center rounded-md border border-white/20 shadow-sm"
                                style={{
                                  ...barStyle,
                                  height: "24px",
                                  top: "12px",
                                }}
                              >
                                <span className="truncate px-2 text-xs font-medium text-white">{task.title}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium">{task.title}</p>
                                {task.startDate && <p className="text-sm">Inicio: {format(parseISO(task.startDate), "PPP", { locale: es })}</p>}
                                {task.endDate && <p className="text-sm">Fin: {format(parseISO(task.endDate), "PPP", { locale: es })}</p>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
