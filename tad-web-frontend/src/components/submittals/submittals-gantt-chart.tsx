"use client"
import React, { useState, useMemo, useRef } from "react"
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, isValid } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function SubmittalsGanttChart({ submittals }: { submittals: any[] }) {
  const [today] = useState(new Date())
  const timelineRef = useRef<HTMLDivElement>(null)
  const namesColumnRef = useRef<HTMLDivElement>(null)

  const handleScroll = (source: "names" | "timeline") => (e: React.UIEvent<HTMLDivElement>) => {
    const target = source === "names" ? timelineRef : namesColumnRef
    if (target.current) target.current.scrollTop = e.currentTarget.scrollTop
  }

  // Agrupar por Manager
  const itemsByUser = useMemo(() => {
    const grp: Record<string, any[]> = {}
    submittals.forEach((item) => {
      const key = item.managerName || item.manager || "Unassigned"
      if (!grp[key]) grp[key] = []
      grp[key].push(item)
    })
    return grp
  }, [submittals])

  const { startDate, totalDays, years, monthMarkers } = useMemo(() => {
    if (!submittals.length) return { startDate: new Date(), totalDays: 1, years: [], monthMarkers: [] }
    
    let minDate = new Date();
    let maxDate = new Date();

    submittals.forEach(i => {
        const c = new Date(i.createdAt);
        const d = i.dueDate ? new Date(i.dueDate) : null;
        if(isValid(c) && c < minDate) minDate = c;
        if(d && isValid(d) && d > maxDate) maxDate = d;
    });

    const start = startOfMonth(minDate);
    start.setDate(start.getDate() - 5);
    const end = endOfMonth(maxDate);
    end.setDate(end.getDate() + 5);
    const days = differenceInDays(end, start) + 1;

    const months = eachMonthOfInterval({ start, end }).map(d => ({ month: format(d, "MMM"), date: d }));
    const uniqueYears = Array.from(new Set(months.map(m => format(m.date, "yyyy"))));
    const yearObjs = uniqueYears.map(y => {
        const yStart = new Date(parseInt(y), 0, 1) < start ? start : new Date(parseInt(y), 0, 1);
        const yEnd = new Date(parseInt(y), 11, 31) > end ? end : new Date(parseInt(y), 11, 31);
        return { year: y, start: differenceInDays(yStart, start), width: differenceInDays(yEnd, yStart) + 1 }
    });

    return { startDate: start, totalDays: days, years: yearObjs, monthMarkers: months }
  }, [submittals]);

  const getPos = (item: any) => {
      const start = new Date(item.createdAt);
      const end = item.dueDate ? new Date(item.dueDate) : new Date(start.getTime() + 864000000); 
      if(!isValid(start) || !isValid(end)) return { left: 0, width: 0 };
      const left = (differenceInDays(start, startDate) / totalDays) * 100;
      const width = (differenceInDays(end, start) / totalDays) * 100;
      return { left: Math.max(0, left), width: Math.max(0.5, width) };
  }

  return (
    <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm h-[500px] flex-col">
       <div className="flex border-b">
          <div className="w-1/4 min-w-[200px] p-2 bg-slate-50 border-r font-bold text-xs text-slate-500 uppercase">Manager / Item</div>
          <div className="flex-1 relative bg-slate-50 overflow-hidden">
              <div className="h-6 relative border-b">
                  {years.map((y, i) => <div key={i} className="absolute h-full border-l pl-1 text-xs font-bold text-slate-400" style={{left: `${(y.start/totalDays)*100}%`, width: `${(y.width/totalDays)*100}%`}}>{y.year}</div>)}
              </div>
              <div className="h-6 flex">
                  {monthMarkers.map((m, i) => <div key={i} className="flex-1 border-l text-[10px] flex items-center justify-center text-slate-400">{m.month}</div>)}
              </div>
          </div>
       </div>
       <div className="flex flex-1 overflow-hidden">
          <div ref={namesColumnRef} onScroll={handleScroll("names")} className="w-1/4 min-w-[200px] overflow-y-auto border-r bg-slate-50/30 p-2">
              {Object.entries(itemsByUser).map(([user, items]) => (
                  <div key={user} className="mb-4">
                      <div className="font-bold text-xs text-slate-700 mb-1 sticky top-0 bg-slate-100 p-1 rounded">{user} ({items.length})</div>
                      {items.map(item => <div key={item.id} className="h-8 flex items-center text-xs text-slate-600 truncate px-2">{item.title}</div>)}
                  </div>
              ))}
          </div>
          <div ref={timelineRef} onScroll={handleScroll("timeline")} className="flex-1 overflow-auto relative">
              <div className="min-w-[800px] h-full relative">
                  <div className="absolute inset-0 flex pointer-events-none">{monthMarkers.map((_, i) => <div key={i} className="flex-1 border-r border-slate-100 h-full"/>)}</div>
                  <div className="absolute top-0 bottom-0 border-l-2 border-cyan-400 z-10" style={{left: `${(differenceInDays(today, startDate)/totalDays)*100}%`}} />
                  <div className="p-2">
                    {Object.entries(itemsByUser).map(([user, items]) => (
                        <div key={user} className="mb-4">
                            <div className="h-6 mb-1"/>
                            {items.map(item => {
                                const { left, width } = getPos(item);
                                return (
                                    <div key={item.id} className="h-8 relative flex items-center">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn("absolute h-4 rounded-full shadow-sm hover:shadow-md cursor-pointer bg-cyan-500")} style={{left: `${left}%`, width: `${width}%`}} />
                                                </TooltipTrigger>
                                                <TooltipContent><p className="font-bold">{item.title}</p><p className="text-xs">Status: {item.status}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                  </div>
              </div>
          </div>
       </div>
    </div>
  )
}