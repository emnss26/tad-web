import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AccService } from "@/services/acc.service"; // Tu nuevo servicio
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Asumiendo que tienes un skeleton loader
import { Users, AlertCircle, FileText, CheckSquare } from "lucide-react";

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
  const { projectId } = useParams<{ projectId: string }>();
  
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

        // Fetch en Paralelo usando tu nuevo servicio
        const [
          projData,
          usersData,
          issuesData,
          rfisData,
          submittalsData
        ] = await Promise.all([
          AccService.getProjectData( projectId),
          AccService.getProjectUsers(projectId),
          AccService.getProjectIssues(projectId),
          AccService.getProjectRfis(projectId),
          AccService.getProjectSubmittals(projectId)
        ]);

        // 1. Set Project Info
        setProject(projData);

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
        // Nota: Los estados de submittals dependen de tu mapeo en backend
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
        setError("Failed to load dashboard data. Check your connection or session.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [projectId]);

  if (error) {
    return (
      <div className="p-10 flex justify-center text-red-500">
        <AlertCircle className="mr-2" /> {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {loading ? <Skeleton className="h-9 w-64" /> : project?.name || "Project Dashboard"}
          </h1>
          <p className="text-muted-foreground">Overview of project metrics and status.</p>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Grid de Métricas (Reemplaza al Slider) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Users Card */}
        <StatCard 
          title="Total Users" 
          value={userCount} 
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

      {/* Viewer Placeholder */}
      <div className="mt-8">
        <Card className="h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle>Project Model Viewer</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-b-lg flex items-center justify-center">
             {loading ? (
               <p className="text-muted-foreground animate-pulse">Loading Model Viewer...</p>
             ) : (
               <div className="text-center">
                 <p className="text-muted-foreground mb-2">Select a model to view</p>
                 <p className="text-xs text-gray-400">(Federated Model logic pending integration)</p>
               </div>
             )}
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
        <Skeleton className="h-7 w-20" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

export default React.memo(ACCProjectPage);