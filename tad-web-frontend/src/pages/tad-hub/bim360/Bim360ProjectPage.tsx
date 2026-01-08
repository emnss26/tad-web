import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Bim360Service } from "@/services/bim360.service"; // Importamos el servicio nuevo
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; 
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, FileText, ArrowLeft } from "lucide-react";

// --- Interfaces para el Estado ---
interface ITotals {
  total: number;
  open?: number;
  answered?: number;
  closed?: number;
  completed?: number;
}

const Bim360ProjectPage = () => {
  const { projectId, accountId } = useParams<{ projectId: string; accountId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  
  // Stats
  const [userCount, setUserCount] = useState(0);
  const [issuesStats, setIssuesStats] = useState<ITotals>({ total: 0, open: 0, answered: 0, closed: 0 });
  const [rfisStats, setRfisStats] = useState<ITotals>({ total: 0, open: 0, answered: 0, closed: 0 });

  useEffect(() => {
    if (!projectId) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch paralelo solo de lo que BIM360 soporta actualmente en tu backend
        const [
          projData,
          usersData,
          issuesData,
          rfisData,
        ] = await Promise.all([
          Bim360Service.getProjectData(projectId),
          Bim360Service.getProjectUsers(projectId),
          Bim360Service.getProjectIssues(projectId),
          Bim360Service.getProjectRfis(projectId),
        ]);

        // 1. Info Proyecto
        setProject(projData);

        // 2. Usuarios
        // El controlador devuelve { count: X, users: [] }
        setUserCount(usersData.count || (Array.isArray(usersData.users) ? usersData.users.length : 0));

        // 3. Issues
        const issues = issuesData.issues || [];
        setIssuesStats({
          total: issuesData.count,
          open: issues.filter((i: any) => i.status === "open").length,
          answered: issues.filter((i: any) => i.status === "answered").length,
          closed: issues.filter((i: any) => i.status === "closed").length
        });

        // 4. RFIs
        const rfis = rfisData.rfis || [];
        setRfisStats({
          total: rfisData.count,
          open: rfis.filter((r: any) => r.status === "open").length,
          answered: rfis.filter((r: any) => r.status === "answered").length,
          closed: rfis.filter((r: any) => r.status === "closed").length
        });

      } catch (err: any) {
        console.error("BIM360 Dashboard Load Error:", err);
        setError("Failed to load dashboard data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [projectId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-red-500">
        <AlertCircle className="h-10 w-10 mb-4" /> 
        <p className="text-lg font-medium">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 h-full overflow-y-auto">
      
      {/* Header & Navigation */}
      <div className="flex flex-col space-y-2">
        <Link to="/bim360projects" className="text-sm text-muted-foreground hover:text-primary flex items-center mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
        </Link>
        <div className="flex justify-between items-start">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? <Skeleton className="h-9 w-96" /> : project?.name || "BIM 360 Project"}
            </h1>
            <div className="text-sm text-muted-foreground mt-1 flex gap-2">
                <span>Account ID: {accountId}</span>
                <span>•</span>
                <span>Project ID: {projectId}</span>
            </div>
            </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Grid de Métricas (Solo 3 columnas ya que no hay submittals) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Users */}
        <StatCard 
          title="Total Users" 
          value={userCount} 
          subtext="Active Team Members"
          icon={<Users className="h-4 w-4 text-blue-500" />} 
          loading={loading} 
        />

        {/* Issues */}
        <StatCard 
          title="Total Issues" 
          value={issuesStats.total} 
          subtext={`${issuesStats.open} Open / ${issuesStats.closed} Closed`}
          icon={<AlertCircle className="h-4 w-4 text-orange-500" />} 
          loading={loading} 
        />

        {/* RFIs */}
        <StatCard 
          title="Total RFIs" 
          value={rfisStats.total} 
          subtext={`${rfisStats.open} Open / ${rfisStats.answered} Answered`}
          icon={<FileText className="h-4 w-4 text-purple-500" />} 
          loading={loading} 
        />
      </div>

      {/* Viewer Area */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 h-[500px] flex flex-col border-2 border-dashed border-indigo-200 dark:border-indigo-900">
          <CardHeader>
            <CardTitle>BIM 360 Model Viewer</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 bg-muted/20 rounded-b-lg flex flex-col items-center justify-center">
             {loading ? (
               <div className="flex flex-col items-center">
                   <Skeleton className="h-32 w-32 rounded-full mb-4" />
                   <p className="text-muted-foreground animate-pulse">Initializing Viewer...</p>
               </div>
             ) : (
               <div className="text-center p-6">
                 <div className="bg-background p-4 rounded-full inline-block mb-4 shadow-sm">
                    {/* Placeholder para logo */}
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 font-bold">360</div>
                 </div>
                 <h3 className="text-lg font-medium">Select a Model</h3>
                 <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    Visualize BIM 360 documents and models here.
                 </p>
                 <Button variant="secondary" disabled>Load Default Model</Button>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to={`issues`}>
                        <AlertCircle className="mr-2 h-4 w-4" /> Manage Issues
                    </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to={`rfis`}>
                        <FileText className="mr-2 h-4 w-4" /> View RFIs
                    </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to={`users`}>
                        <Users className="mr-2 h-4 w-4" /> Team Directory
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>

    </div>
  );
};

const StatCard = ({ title, value, subtext, icon, loading }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-32" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

export default React.memo(Bim360ProjectPage);