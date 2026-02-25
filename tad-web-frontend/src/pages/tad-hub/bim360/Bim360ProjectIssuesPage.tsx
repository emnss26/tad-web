import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Bim360Service } from "@/services/bim360.service"; // <--- CAMBIO CLAVE
import { utils, writeFile } from "xlsx";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, ListTodo, Download, FilterX, BarChart3, Clock, GanttChart } from "lucide-react";

// Components (Reutilizamos los de ACC ya que la estructura es igual)
import { IssueStatusChart } from "@/components/issues/issue-status-chart";
import { IssuesTable } from "@/components/issues/issues-table";
import { IssuesGanttChart } from "@/components/issues/issues-gantt-chart";
import { StatCard } from "@/components/users/stat-card"; 

export default function Bim360ProjectIssuesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  
  // States
  const [issues, setIssues] = useState<any[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("table"); 
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // 1. Cargar Datos
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await Bim360Service.getProjectIssues(projectId);
        const rawIssues = response.issues || response || [];
        
        setIssues(rawIssues);
        setFilteredIssues(rawIssues);
      } catch (err: any) {
        console.error("Error loading BIM360 issues:", err);
        setError("Failed to load project issues.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // 2. Stats
  const stats = useMemo(() => {
    return {
        total: issues.length,
        open: issues.filter(i => i.status === 'open').length,
        answered: issues.filter(i => i.status === 'answered').length,
        closed: issues.filter(i => i.status === 'closed').length,
        void: issues.filter(i => i.status === 'void').length
    };
  }, [issues]);

  const statusCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      issues.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1 });
      return counts;
  }, [issues]);

  // 3. Filtrado
  useEffect(() => {
      if (selectedStatus) {
          setFilteredIssues(issues.filter(i => i.status === selectedStatus));
      } else {
          setFilteredIssues(issues);
      }
  }, [selectedStatus, issues]);

  // 4. Exportar
  const handleExport = () => {
      const ws = utils.json_to_sheet(filteredIssues.map(i => ({
          ID: i.displayId,
          Title: i.title,
          Status: i.status,
          AssignedTo: i.assignedTo,
          DueDate: i.dueDate
      })));
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "BIM360 Issues");
      writeFile(wb, `BIM360_Project_${projectId}_Issues.xlsx`);
  };

  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-indigo-50/30 p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-indigo-900">BIM 360 Issues</h1>
            <p className="text-slate-500 mt-1">Track defects and coordination problems</p>
        </div>
        <div className="flex gap-2">
            {selectedStatus && (
                <Button variant="outline" onClick={() => setSelectedStatus(null)}>
                    <FilterX className="mr-2 h-4 w-4"/> Clear Filter
                </Button>
            )}
            <Button onClick={handleExport} disabled={loading || issues.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="mr-2 h-4 w-4"/> Export
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Issues" value={stats.total} icon={<ListTodo className="h-5 w-5 text-indigo-500"/>} loading={loading} />
        <StatCard title="Open" value={stats.open} icon={<AlertCircle className="h-5 w-5 text-amber-600"/>} loading={loading} variant="warning" />
        <StatCard title="Answered" value={stats.answered} icon={<Clock className="h-5 w-5 text-blue-600"/>} loading={loading} variant="primary" />
        <StatCard title="Closed" value={stats.closed} icon={<CheckCircle2 className="h-5 w-5 text-green-600"/>} loading={loading} variant="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Column */}
        <div className="lg:col-span-1">
            <Card className="h-full flex flex-col border-indigo-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5"/> By Status</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px] p-0 flex items-center justify-center">
                    {loading ? (
                        <Skeleton className="h-full w-full" />
                    ) : (
                        <IssueStatusChart data={statusCounts} selectedStatus={selectedStatus} onSliceClick={setSelectedStatus} />
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
            <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
                <Tabs value={activeView} onValueChange={setActiveView} className="w-full h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <TabsList className="bg-white border">
                            <TabsTrigger value="table" className="gap-2"><ListTodo className="h-4 w-4"/> List</TabsTrigger>
                            <TabsTrigger value="gantt" className="gap-2"><GanttChart className="h-4 w-4"/> Timeline</TabsTrigger>
                        </TabsList>
                    </div>

                    <Card className="flex-1 flex flex-col overflow-hidden border-indigo-100">
                        <CardHeader className="py-4 px-6 border-b bg-white">
                            <CardTitle>{activeView === 'table' ? 'Issues List' : 'Issues Timeline'}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden">
                            <TabsContent value="table" className="h-full m-0 p-0">
                                {loading ? <div className="p-6 space-y-2"><Skeleton className="h-10 w-full"/><Skeleton className="h-64 w-full"/></div> : 
                                    <IssuesTable issues={filteredIssues} onViewDetails={(id) => console.log("View", id)} />
                                }
                            </TabsContent>
                            <TabsContent value="gantt" className="h-full m-0 p-4 overflow-auto">
                                {loading ? <Skeleton className="h-full w-full"/> : 
                                    <IssuesGanttChart issues={filteredIssues} />
                                }
                            </TabsContent>
                        </CardContent>
                    </Card>
                </Tabs>
            </Card>
        </div>
      </div>
    </div>
  );
}
