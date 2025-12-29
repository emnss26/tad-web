import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { AccService } from "@/services/acc.service";
import { utils, writeFile } from "xlsx";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/users/stat-card";
import { FileBox, Clock, CheckCircle, Download, FilterX, ListTodo, GanttChart } from "lucide-react";

// Components
import { SubmittalStatusChart, SubmittalSpecChart } from "@/components/submittals/submittals-charts";
import { SubmittalsTable } from "@/components/submittals/submittals-table";
import { SubmittalsGanttChart } from "@/components/submittals/submittals-gantt-chart";

export default function ACCProjectSubmittalsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [submittals, setSubmittals] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<{key: string, value: string} | null>(null);

  useEffect(() => {
    if (!projectId) return;
    AccService.getProjectSubmittals(projectId)
      .then((data: any) => {
        const list = data.submittals || data || [];
        setSubmittals(list);
        setFiltered(list);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if(activeFilter) {
        setFiltered(submittals.filter(s => {
            if(activeFilter.key === 'spec') return s.specDetails?.title === activeFilter.value || s.specTitle === activeFilter.value;
            return s[activeFilter.key] === activeFilter.value;
        }));
    } else {
        setFiltered(submittals);
    }
  }, [activeFilter, submittals]);

  const stats = useMemo(() => ({
    total: submittals.length,
    open: submittals.filter(s => s.status !== 'closed' && s.status !== 'void').length,
    closed: submittals.filter(s => s.status === 'closed').length
  }), [submittals]);

  const counts = useMemo(() => {
    const s: any = {}, sp: any = {};
    submittals.forEach(i => {
        s[i.status] = (s[i.status] || 0) + 1;
        const spec = i.specDetails?.title || i.specTitle || "Unspecified";
        sp[spec] = (sp[spec] || 0) + 1;
    });
    return { status: s, spec: sp };
  }, [submittals]);

  const handleExport = () => {
    const ws = utils.json_to_sheet(filtered);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Submittals");
    writeFile(wb, `Submittals_${projectId}.xlsx`);
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-50/50 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Submittals Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage project submittals</p>
        </div>
        <div className="flex gap-2">
            {activeFilter && <Button variant="outline" onClick={() => setActiveFilter(null)}><FilterX className="mr-2 h-4 w-4"/> Clear Filter</Button>}
            <Button onClick={handleExport}><Download className="mr-2 h-4 w-4"/> Export</Button>
        </div>
      </div>

      {activeFilter && (
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Filtered by:</span>
            <Badge variant="secondary" className="gap-1 capitalize cursor-pointer" onClick={() => setActiveFilter(null)}>
                {activeFilter.key}: {activeFilter.value} <span className="hover:text-red-500">×</span>
            </Badge>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total" value={stats.total} icon={<FileBox className="h-5 w-5"/>} loading={loading} />
        <StatCard title="Open/Active" value={stats.open} icon={<Clock className="h-5 w-5 text-amber-500"/>} loading={loading} variant="warning" />
        <StatCard title="Closed" value={stats.closed} icon={<CheckCircle className="h-5 w-5 text-green-500"/>} loading={loading} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Status</CardTitle></CardHeader>
                <CardContent className="h-[250px]">
                    {loading ? <Skeleton className="h-full"/> : <SubmittalStatusChart data={counts.status} onClick={(v: string) => setActiveFilter({key: 'status', value: v})} />}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Specification</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                    {loading ? <Skeleton className="h-full"/> : <SubmittalSpecChart data={counts.spec} onClick={(v: string) => setActiveFilter({key: 'spec', value: v})} />}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
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
                            {loading ? <Skeleton className="h-full"/> : <SubmittalsTable items={filtered} />}
                        </TabsContent>
                        <TabsContent value="gantt" className="m-0 h-full p-4 overflow-auto">
                            {loading ? <Skeleton className="h-full"/> : <SubmittalsGanttChart submittals={filtered} />}
                        </TabsContent>
                    </Card>
                </Tabs>
            </Card>
        </div>
      </div>
    </div>
  );
}