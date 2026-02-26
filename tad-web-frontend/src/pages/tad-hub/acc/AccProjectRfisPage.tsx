import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { AccService } from "@/services/acc.service";
import { utils, writeFile } from "xlsx";

// UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ModulePageHeader from "@/components/hub/ModulePageHeader";
import { StatCard } from "@/components/users/stat-card";
import { FileText, Clock, CheckCircle, Download, FilterX, ListTodo, GanttChart } from "lucide-react";

// Components
import { RfiChartsCarousel } from "@/components/rfis/rfis-charts-carousel";
import { RfisTable } from "@/components/rfis/rfis-table";
import { RfisGanttChart } from "@/components/rfis/rfis-gantt-chart";

export default function ACCProjectRfisPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [rfis, setRfis] = useState<any[]>([]);
  const [filteredRfis, setFilteredRfis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [activeFilter, setActiveFilter] = useState<{key: string, value: string} | null>(null);

  useEffect(() => {
    if (!projectId) return;
    AccService.getProjectRfis(projectId)
      .then((data: any) => {
        const list = data.rfis || data || [];
        setRfis(list);
        setFilteredRfis(list);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  // Aplicar Filtros
  useEffect(() => {
      if(activeFilter) {
          setFilteredRfis(rfis.filter(r => r[activeFilter.key] === activeFilter.value));
      } else {
          setFilteredRfis(rfis);
      }
  }, [activeFilter, rfis]);

  // Stats Calculations
  const stats = useMemo(() => ({
      total: rfis.length,
      open: rfis.filter(r => r.status === 'open').length,
      answered: rfis.filter(r => r.status === 'answered').length,
      closed: rfis.filter(r => r.status === 'closed').length
  }), [rfis]);

  const counts = useMemo(() => {
      const s: any = {}, p: any = {}, d: any = {};
      rfis.forEach(r => {
          s[r.status] = (s[r.status] || 0) + 1;
          const pri = r.priority || "normal";
          p[pri] = (p[pri] || 0) + 1;
          if(r.discipline) d[r.discipline] = (d[r.discipline] || 0) + 1;
      });
      return { status: s, priority: p, discipline: d };
  }, [rfis]);

  const handleExport = () => {
      const ws = utils.json_to_sheet(filteredRfis);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "RFIs");
      writeFile(wb, `RFIs_${projectId}.xlsx`);
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-50/50 animate-in fade-in">
        <ModulePageHeader
            title="RFIs"
            description="Request for Information tracking."
            actions={
                <>
                    {activeFilter && (
                        <Button variant="outline" onClick={() => setActiveFilter(null)}>
                            <FilterX className="mr-2 h-4 w-4" /> Clear Filter
                        </Button>
                    )}
                    <Button onClick={handleExport} disabled={loading}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </>
            }
        />

        {/* Active Filter Badge */}
        {activeFilter && (
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Filtered by:</span>
                <Badge variant="secondary" className="gap-1 capitalize cursor-pointer" onClick={() => setActiveFilter(null)}>
                    {activeFilter.key}: {activeFilter.value} <span className="hover:text-red-500">×</span>
                </Badge>
            </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Total RFIs" value={stats.total} icon={<FileText className="h-5 w-5"/>} loading={loading} />
            <StatCard title="Open" value={stats.open} icon={<Clock className="h-5 w-5 text-amber-500"/>} loading={loading} variant="warning" />
            <StatCard title="Answered" value={stats.answered} icon={<FileText className="h-5 w-5 text-blue-500"/>} loading={loading} variant="primary" />
            <StatCard title="Closed" value={stats.closed} icon={<CheckCircle className="h-5 w-5 text-green-500"/>} loading={loading} variant="success" />
        </div>

        {/* Charts & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Charts Carousel */}
            <div className="h-[650px]">
                <RfiChartsCarousel
                    counts={counts}
                    loading={loading}
                    onFilter={(key, value) => setActiveFilter({ key, value })}
                    className="h-full"
                />
            </div>

            {/* Right Column: Tabs (Table / Gantt) */}
            <div className="lg:col-span-2 h-[650px]">
                <Card className="h-full border-none shadow-none bg-transparent">
                    <Tabs defaultValue="list" className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <TabsList className="bg-white border">
                                <TabsTrigger value="list" className="gap-2"><ListTodo className="h-4 w-4"/> List</TabsTrigger>
                                <TabsTrigger value="gantt" className="gap-2"><GanttChart className="h-4 w-4"/> Timeline</TabsTrigger>
                            </TabsList>
                        </div>

                        <Card className="flex-1 overflow-hidden bg-white">
                            <TabsContent value="list" className="m-0 h-full p-4 overflow-auto">
                                {loading ? <Skeleton className="h-full"/> : <RfisTable rfis={filteredRfis} onViewDetails={() => {}} />}
                            </TabsContent>
                            <TabsContent value="gantt" className="m-0 h-full p-4 overflow-auto">
                                {loading ? <Skeleton className="h-full"/> : <RfisGanttChart rfis={filteredRfis} />}
                            </TabsContent>
                        </Card>
                    </Tabs>
                </Card>
            </div>
        </div>
    </div>
  )
}
