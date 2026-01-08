import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AccService } from "@/services/acc.service"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; 
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, FileText, CheckSquare, ArrowLeft } from "lucide-react";

// --- Interfaces para el Estado ---
interface ITotals {
  total: number;
  open?: number;
  answered?: number;
  closed?: number;
  completed?: number;
  // Submittals specific
  waiting?: number;
  inReview?: number;
  reviewed?: number;
  submitted?: number;
}

const ACCProjectPage = () => {
  // Ahora leemos accountId también, aunque el servicio principal use projectId
  const { projectId, accountId } = useParams<{ projectId: string; accountId: string }>();
  
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  
  // Totales para las tarjetas
  const [userCount, setUserCount] = useState(0);
  const [issuesStats, setIssuesStats] = useState<ITotals>({ total: 0, open: 0, answered: 0, closed: 0 });
  const [rfisStats, setRfisStats] = useState<ITotals>({ total: 0, open: 0, answered: 0, closed: 0 });
  const [submittalsStats, setSubmittalsStats] = useState<ITotals>({ total: 0 });

  useEffect(() => {
    if (!projectId) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch en Paralelo usando el servicio ACC
        const [
          projData,
          usersData,
          issuesData,
          rfisData,
          submittalsData
        ] = await Promise.all([
          AccService.getProjectData(projectId),
          AccService.getProjectUsers(projectId),
          AccService.getProjectIssues(projectId),
          AccService.getProjectRfis(projectId),
          AccService.getProjectSubmittals(projectId)
        ]);

        // 1. Set Project Info
        setProject(projData);
        console.log("Project Data:", projData);

        // 2. Set Users
        setUserCount(usersData.count || usersData.users?.length || 0);

        // 3. Set Issues Stats
        const issues = issuesData.issues || [];
        setIssuesStats({
          total: issuesData.count,
          open: issues.filter((i: any) => i.status === "open").length,
          answered: issues.filter((i: any) => i.status === "answered").length,
          closed: issues.filter((i: any) => i.status === "closed").length
        });

        // 4. Set RFIs Stats
        const rfis = rfisData.rfis || [];
        setRfisStats({
          total: rfisData.count,
          open: rfis.filter((r: any) => r.status === "open").length,
          answered: rfis.filter((r: any) => r.status === "answered").length,
          closed: rfis.filter((r: any) => r.status === "closed").length
        });

        // 5. Set Submittals Stats
        const subs = submittalsData.submittals || [];
        setSubmittalsStats({
          total: submittalsData.count,
          waiting: subs.filter((s: any) => s.status === "Waiting for submission").length,
          inReview: subs.filter((s: any) => s.status === "In review").length,
          reviewed: subs.filter((s: any) => s.status === "Reviewed").length,
          closed: subs.filter((s: any) => s.status === "Closed").length
        });

      } catch (err: any) {
        console.error("Dashboard Load Error:", err);
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
        <Link to="/acc-projects" className="text-sm text-muted-foreground hover:text-primary flex items-center mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
        </Link>
        <div className="flex justify-between items-start">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {loading ? <Skeleton className="h-9 w-96" /> : project?.name || "Project Dashboard"}
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

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Users Card */}
        <StatCard 
          title="Total Users" 
          value={userCount} 
          subtext="Active Team Members"
          icon={<Users className="h-4 w-4 text-blue-500" />} 
          loading={loading} 
        />

        {/* Issues Card */}
        <StatCard 
          title="Total Issues" 
          value={issuesStats.total} 
          subtext={`${issuesStats.open} Open / ${issuesStats.closed} Closed`}
          icon={<AlertCircle className="h-4 w-4 text-orange-500" />} 
          loading={loading} 
        />

        {/* RFIs Card */}
        <StatCard 
          title="Total RFIs" 
          value={rfisStats.total} 
          subtext={`${rfisStats.open} Open / ${rfisStats.answered} Answered`}
          icon={<FileText className="h-4 w-4 text-purple-500" />} 
          loading={loading} 
        />

        {/* Submittals Card */}
        <StatCard 
          title="Total Submittals" 
          value={submittalsStats.total} 
          subtext={`${submittalsStats.inReview || 0} In Review`}
          icon={<CheckSquare className="h-4 w-4 text-green-500" />} 
          loading={loading} 
        />
      </div>

      {/* Viewer Placeholder (Área Central) */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Viewer Principal */}
        <Card className="lg:col-span-2 h-[500px] flex flex-col border-2 border-dashed border-muted">
          <CardHeader>
            <CardTitle>3D Model Viewer</CardTitle>
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
                    <img src="/tadLogo.png" alt="TAD" className="h-12 w-12 opacity-50 grayscale" />
                 </div>
                 <h3 className="text-lg font-medium">Select a Model</h3>
                 <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    Choose a federated model from the list or upload a new IFC file to visualize the project in 3D.
                 </p>
                 <Button variant="secondary" disabled>Load Default Model</Button>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Actividad Reciente / Lista Rápida */}
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
                    <Link to={`submittals`}>
                        <CheckSquare className="mr-2 h-4 w-4" /> Track Submittals
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

// Componente pequeño para tarjetas de estadística
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

export default React.memo(ACCProjectPage);