"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { format, differenceInDays, isAfter, startOfMonth, endOfMonth, eachMonthOfInterval, isValid } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const MONTH_ACRONYMS: Record<string, string> = {
  "01": "JAN", "02": "FEB", "03": "MAR", "04": "APR", "05": "MAY", "06": "JUN",
  "07": "JUL", "08": "AUG", "09": "SEP", "10": "OCT", "11": "NOV", "12": "DEC",
}

interface Issue {
  id: string
  title: string
  status: string
  assignedTo?: string
  displayId?: string
  createdAt?: string
  dueDate?: string
}

interface IssuesGanttChartProps {
  issues: Issue[]
}

export function IssuesGanttChart({ issues }: IssuesGanttChartProps) {
  const [today] = useState(new Date())
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [totalDays, setTotalDays] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Referencias para scroll sincronizado
  const timelineRef = useRef<HTMLDivElement>(null)
  const namesColumnRef = useRef<HTMLDivElement>(null)

  const handleNamesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (timelineRef.current) timelineRef.current.scrollTop = e.currentTarget.scrollTop
  }

  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (namesColumnRef.current) namesColumnRef.current.scrollTop = e.currentTarget.scrollTop
  }

  // Filtrado simple local
  const filteredIssues = useMemo(() => {
    if (!searchTerm) return issues;
    return issues.filter(i => 
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.assignedTo || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [issues, searchTerm]);

  // Agrupar por Usuario
  const issuesByUser = useMemo(() => {
    const grp: Record<string, Issue[]> = {}
    filteredIssues.forEach((i) => {
      const assignee = i.assignedTo || "Unassigned";
      if (!grp[assignee]) grp[assignee] = []
      grp[assignee].push(i)
    })
    return grp
  }, [filteredIssues])

  // Calcular Rango de Fechas del Proyecto
  useEffect(() => {
    if (!filteredIssues.length) return
    
    let minDate: Date | null = null
    let maxDate: Date | null = null

    filteredIssues.forEach((i) => {
      if (!i.createdAt) return;
      const created = new Date(i.createdAt);
      const due = i.dueDate ? new Date(i.dueDate) : null;

      if (isValid(created)) {
          if (!minDate || created < minDate) minDate = created
      }
      
      if (due && isValid(due)) {
        if (!maxDate || due > maxDate) maxDate = due
      }
    })

    // Si no hay fechas válidas, usar el mes actual
    if (!minDate) minDate = startOfMonth(new Date());
    if (!maxDate) maxDate = endOfMonth(new Date());

    // Dar un margen de 5 días antes y después
    const start = startOfMonth(minDate || new Date())
    start.setDate(start.getDate() - 5)
    
    const end = endOfMonth(maxDate || new Date())
    end.setDate(end.getDate() + 5)

    setStartDate(start)
    setEndDate(end)
    setTotalDays(differenceInDays(end, start) + 1)
  }, [filteredIssues])

  // Generar marcadores de Años y Meses
  const { years, monthMarkers } = useMemo(() => {
    if (!startDate || !endDate) return { years: [], monthMarkers: [] }
    
    // Meses
    const months = eachMonthOfInterval({ start: startDate, end: endDate }).map((date) => ({
      month: MONTH_ACRONYMS[format(date, "MM")] || format(date, "MMM"),
      date,
    }))

    // Años (Lógica simplificada)
    const uniqueYears = Array.from(new Set(months.map(m => format(m.date, "yyyy"))));
    const yearObjs = uniqueYears.map(yearStr => {
        const yearStart = new Date(parseInt(yearStr), 0, 1) < startDate ? startDate : new Date(parseInt(yearStr), 0, 1);
        const yearEnd = new Date(parseInt(yearStr), 11, 31) > endDate ? endDate : new Date(parseInt(yearStr), 11, 31);
        return {
            year: yearStr,
            startDay: differenceInDays(yearStart, startDate),
            width: differenceInDays(yearEnd, yearStart) + 1
        }
    });

    return { years: yearObjs, monthMarkers: months }
  }, [startDate, endDate, totalDays])

  // Utilidades de Renderizado
  const getStatusColor = (st: string) => {
    switch (st) {
        case "closed": return "bg-green-500 text-white";
        case "in_review": return "bg-purple-500 text-white";
        case "answered": return "bg-blue-500 text-white";
        case "void": return "bg-gray-400 text-white";
        default: return "bg-yellow-500 text-white"; // Open
    }
  }

  const calculateBarPosition = (issue: Issue) => {
    if (!startDate || !issue.createdAt) return { left: 0, width: 0, overdue: 0 }
    
    const created = new Date(issue.createdAt);
    const due = issue.dueDate ? new Date(issue.dueDate) : new Date(created.getTime() + 86400000); // Default 1 dia si no tiene due date
    
    if (!isValid(created) || !isValid(due)) return { left: 0, width: 0, overdue: 0 };

    const overdueDays = (issue.status === "open" && isAfter(today, due)) ? differenceInDays(today, due) : 0
    
    const startOffset = Math.max(0, differenceInDays(created, startDate))
    const duration = Math.max(1, differenceInDays(due, created)) // Mínimo 1 día de ancho

    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100,
      overdue: (overdueDays / totalDays) * 100,
    }
  }

  if (!startDate || !endDate) return <div className="h-64 flex items-center justify-center text-slate-400">Loading timeline data...</div>

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="bg-sky-100 text-sky-800 px-4 py-2 rounded-lg flex items-center gap-2 border border-sky-200">
          <Calendar className="h-4 w-4" />
          <span className="font-medium text-sm">Today: {format(today, "MMM d, yyyy")}</span>
        </div>
        <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                placeholder="Filter by name or title..."
                className="pl-10 w-[250px] bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* GANTT HEADER (Timeline) */}
      <div className="flex border rounded-t-lg overflow-hidden bg-white shadow-sm">
        <div className="w-1/4 min-w-[200px] bg-slate-50 border-r p-2 flex items-end pb-2 font-semibold text-slate-600 text-sm">
            Assignee / Issue
        </div>
        <div className="flex-1 min-w-[750px]">
          {/* Years Row */}
          <div className="h-6 relative bg-slate-100 border-b border-slate-200">
            {years.map((y, i) => (
              <div key={i} className="absolute h-full flex items-center pl-2 text-xs font-bold text-slate-500 border-l border-slate-300"
                style={{ left: `${(y.startDay / totalDays) * 100}%`, width: `${(y.width / totalDays) * 100}%` }}>
                {y.year}
              </div>
            ))}
          </div>
          {/* Months Row */}
          <div className="h-8 flex bg-slate-50">
            {monthMarkers.map((m, i) => (
              <div key={i} className="h-full flex-1 flex items-center justify-center text-[10px] font-medium text-slate-500 border-l border-slate-200 first:border-l-0">
                {m.month}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GANTT BODY */}
      <div className="flex border border-t-0 rounded-b-lg overflow-hidden bg-white shadow-sm h-[500px]">
        
        {/* Left Column: Names */}
        <div ref={namesColumnRef} onScroll={handleNamesScroll} className="w-1/4 min-w-[200px] overflow-y-hidden border-r bg-slate-50/50">
          <div className="p-2 space-y-4">
            {Object.entries(issuesByUser).map(([user, items]) => (
              <div key={user}>
                <div className="font-semibold text-xs text-slate-700 uppercase tracking-wider mb-2 sticky top-0 bg-slate-100 py-1 px-2 rounded">
                  {user} <span className="text-slate-400 font-normal">({items.length})</span>
                </div>
                <div className="space-y-1">
                  {items.map((issue) => (
                    <div key={issue.id} className="h-8 flex items-center px-2 text-xs text-slate-600 truncate hover:bg-slate-100 rounded cursor-default" title={issue.title}>
                      {issue.displayId || issue.id}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Bars */}
        <div ref={timelineRef} onScroll={handleTimelineScroll} className="flex-1 overflow-x-auto overflow-y-auto relative">
           <div className="min-w-[750px] relative h-full">
            
            {/* Grid Lines (Optional) */}
            <div className="absolute inset-0 flex pointer-events-none">
                {monthMarkers.map((_, i) => <div key={i} className="flex-1 border-r border-slate-100 h-full"/>)}
            </div>

            {/* Today Line */}
            <div className="absolute top-0 bottom-0 border-l-2 border-red-400 z-10 opacity-50"
                 style={{ left: `${(differenceInDays(today, startDate) / totalDays) * 100}%` }} />

            <div className="p-2 space-y-4">
              {Object.entries(issuesByUser).map(([user, items]) => (
                <div key={user}>
                  <div className="h-6 mb-2" /> {/* Spacer for user name header */}
                  <div className="space-y-1">
                    {items.map((issue) => {
                      const { left, width, overdue } = calculateBarPosition(issue)
                      return (
                        <div key={issue.id} className="h-8 relative flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute h-5 rounded-full cursor-pointer hover:shadow-md transition-all flex"
                                     style={{ left: `${left}%`, width: `${width + overdue}%`, minWidth: '4px' }}>
                                  
                                  {/* Barra Principal */}
                                  <div className={cn("h-full rounded-full w-full", getStatusColor(issue.status))} 
                                       style={{ width: overdue > 0 ? `${(width / (width + overdue)) * 100}%` : "100%", 
                                                borderRadius: overdue > 0 ? "99px 0 0 99px" : "99px" }} />
                                  
                                  {/* Barra Overdue */}
                                  {overdue > 0 && (
                                    <div className="h-full bg-red-500 rounded-r-full" 
                                         style={{ width: `${(overdue / (width + overdue)) * 100}%` }} />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs bg-slate-900 text-white border-0">
                                <p className="font-bold">{issue.title}</p>
                                <p>Status: {issue.status}</p>
                                <p>Due: {issue.dueDate ? format(new Date(issue.dueDate), "MMM d") : "No date"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}