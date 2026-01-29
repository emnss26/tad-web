import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Bim360Service } from "@/services/bim360.service"; 
import { DmService } from "@/services/dm.service"; // <--- Agregado: Servicio de Data Management
import { simpleViewer } from "@/utils/viewers/simple.viewer"; // <--- Agregado: Tu viewer

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; 
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // <--- Agregado
import { ScrollArea } from "@/components/ui/scroll-area"; // <--- Agregado
import { Badge } from "@/components/ui/badge"; // <--- Agregado
import { 
  Users, AlertCircle, FileText, ArrowLeft, 
  Box, Cuboid, Loader2 // <--- Nuevos iconos agregados
} from "lucide-react";

// --- Interfaces ---
interface ITotals {
  total: number;
  open?: number;
  answered?: number;
  closed?: number;
  completed?: number;
}

// <--- Agregada interface para Modelos
interface IModelFile {
  id: string;
  name: string;
  folderName: string;
  extension: string;
  urn: string;
  versionNumber?: number;
}

const Bim360ProjectPage = () => {
  const { projectId, accountId } = useParams<{ projectId: string; accountId: string }>();
  
  // Dashboard States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  
  // Stats States
  const [userCount, setUserCount] = useState(0);
  const [issuesStats, setIssuesStats] = useState<ITotals>({ total: 0, open: 0, answered: 0, closed: 0 });
  const [rfisStats, setRfisStats] = useState<ITotals>({ total: 0, open: 0, answered: 0, closed: 0 });

  // Viewer & Models States (NUEVO)
  const [models, setModels] = useState<IModelFile[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedUrn, setSelectedUrn] = useState<string | null>(null);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const viewerInitialized = useRef(false); 

  // ------------------------------------------
  // 1. Carga Inicial de Datos (Mantenemos lógica BIM360)
  // ------------------------------------------
  useEffect(() => {
    if (!projectId) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

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

        setProject(projData);
        setUserCount(usersData.count || (Array.isArray(usersData.users) ? usersData.users.length : 0));

        const issues = issuesData.issues || [];
        setIssuesStats({
          total: issuesData.count,
          open: issues.filter((i: any) => i.status === "open").length,
          answered: issues.filter((i: any) => i.status === "answered").length,
          closed: issues.filter((i: any) => i.status === "closed").length
        });

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

  // ------------------------------------------
  // 2. Lógica para Cargar Modelos (DM Service sirve para BIM360 y ACC)
  // ------------------------------------------
  const handleFetchModels = async () => {
    if (models.length > 0 || !projectId || !accountId) return; 

    try {
      setLoadingModels(true);
      // Asumimos que DmService maneja la lógica de Hub ID internamente o concatenando 'b.'
      const data = await DmService.getProjectModels(projectId, accountId);
      setModels(data.data || []);
    } catch (err) {
      console.error("Error fetching models:", err);
    } finally {
      setLoadingModels(false);
    }
  };

  // ------------------------------------------
  // 3. Lógica para Inicializar Viewer
  // ------------------------------------------
  useEffect(() => {
    if (selectedUrn && !viewerInitialized.current) {
      console.log("Initializing Viewer for URN:", selectedUrn);
      setTimeout(() => {
        simpleViewer(selectedUrn);
        viewerInitialized.current = true; 
      }, 100);
    }
    return () => {
       if (selectedUrn) viewerInitialized.current = false;
    };
  }, [selectedUrn]);

  const handleSelectModel = (urn: string) => {
    setSelectedUrn(null); 
    setTimeout(() => {
        setSelectedUrn(urn);
        setIsModelDialogOpen(false); 
    }, 50);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-red-500">
        <AlertCircle className="h-10 w-10 mb-4" /> 
        <p className="text-lg font-medium">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 h-full overflow-y-auto">
      
      {/* --- HEADER --- */}
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

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={userCount} subtext="Active Members" icon={<Users className="h-4 w-4 text-blue-500" />} loading={loading} />
        <StatCard title="Total Issues" value={issuesStats.total} subtext={`${issuesStats.open} Open`} icon={<AlertCircle className="h-4 w-4 text-orange-500" />} loading={loading} />
        <StatCard title="Total RFIs" value={rfisStats.total} subtext={`${rfisStats.open} Open`} icon={<FileText className="h-4 w-4 text-purple-500" />} loading={loading} />
      </div>

      {/* --- VIEWER SECTION (Actualizado estilo ACC) --- */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Viewer Card */}
        <Card className="lg:col-span-2 h-[600px] flex flex-col border-2 border-muted overflow-hidden relative">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-muted/10 border-b">
            <CardTitle className="text-md flex items-center gap-2">
                <Cuboid className="h-5 w-5" /> BIM 360 Model Viewer
            </CardTitle>
            
            {/* --- MODEL SELECTOR DIALOG --- */}
            <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleFetchModels}>
                        {selectedUrn ? "Change Model" : "Select Model"}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Select a BIM 360 Model</DialogTitle>
                    </DialogHeader>
                    
                    {loadingModels ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Searching for .rvt, .dwg, .nwd files...</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[300px] pr-4">
                            {models.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No models found in this project.</p>
                            ) : (
                                <div className="space-y-2">
                                    {models.map((file) => (
                                        <div 
                                            key={file.id} 
                                            onClick={() => handleSelectModel(file.urn)}
                                            className="flex items-center justify-between p-3 rounded-md border hover:bg-accent cursor-pointer transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 p-2 rounded text-primary">
                                                    <Box className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm group-hover:underline">{file.name}</span>
                                                    <span className="text-xs text-muted-foreground">Folder: {file.folderName}</span>
                                                </div>
                                            </div>
                                            {file.versionNumber && (
                                                <Badge variant="secondary" className="text-xs">v{file.versionNumber}</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
            {/* --- END DIALOG --- */}

          </CardHeader>

          <CardContent className="flex-1 p-0 relative bg-black/5">
              {selectedUrn ? (
                  <div 
                    id="TADSimpleViwer" 
                    className="w-full h-full relative"
                    style={{ minHeight: '100%' }}
                  >
                    {/* El viewer de Autodesk inyectará aquí el canvas */}
                  </div>
              ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-background/50 backdrop-blur-sm">
                     <div className="bg-background p-4 rounded-full inline-block mb-4 shadow-sm border">
                        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 font-bold">360</div>
                     </div>
                     <h3 className="text-lg font-medium">No Model Selected</h3>
                     <p className="text-muted-foreground mb-4 max-w-sm mx-auto text-sm">
                        Select a model from your BIM 360 files to start visualization.
                     </p>
                     <Button onClick={() => { setIsModelDialogOpen(true); handleFetchModels(); }}>
                        Browse Models
                     </Button>
                  </div>
              )}
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="h-[600px] flex flex-col">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start h-12" onClick={() => { setIsModelDialogOpen(true); handleFetchModels(); }}>
                    <Cuboid className="mr-3 h-5 w-5 text-indigo-500" /> 
                    <div className="flex flex-col items-start">
                        <span className="font-semibold">Select Model</span>
                        <span className="text-xs text-muted-foreground font-normal">Visualize BIM 360 Data</span>
                    </div>
                </Button>

                <div className="my-2 border-t" />

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

export default React.memo(Bim360ProjectPage);