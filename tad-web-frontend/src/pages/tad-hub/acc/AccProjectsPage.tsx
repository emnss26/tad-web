import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Search, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interfaz ajustada a tu respuesta JSON real
interface Project {
  id: string;
  name: string;
  platform?: string;
  accountId?: string; 
  // Mantengo estos por compatibilidad si la API cambia formato
  attributes?: {      
    name: string;
    description?: string;
  };
  relationships?: {   
    hub: { data: { id: string } };
  };
}

export default function ACCProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/acc/projects`, {
            credentials: 'include' 
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error("Session expired.");
          throw new Error("Failed to load projects.");
        }

        const json = await response.json();
        const projectsList = json.data?.projects || json.data || []; 
        setProjects(projectsList);
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const name = p.name || p.attributes?.name || "Untitled";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">ACC Projects</h1>
            <p className="text-muted-foreground">Select a project to view its dashboard.</p>
        </div>
        <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search projects..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && !error && filteredProjects.length === 0 && (
        <div className="text-center py-20 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">No projects found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
            const name = project.name || project.attributes?.name || "Unknown Project";
            // Extraer descripción si existe en attributes, sino string vacio
            const description = project.attributes?.description || ""; 
            
            // 1. Obtener Account ID
            let rawAccountId = project.accountId || project.relationships?.hub?.data?.id || "";
            const cleanAccountId = rawAccountId.replace(/^b\./, '');

            // 2. Obtener Project ID
            let rawProjectId = project.id;
            const cleanProjectId = rawProjectId.replace(/^b\./, '');

            const isValid = cleanAccountId && cleanProjectId;

            return (
                <Card key={project.id} className="p-6 hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-muted rounded capitalize">
                            {project.platform || "ACC"}
                        </span>
                    </div>
                    
                    <div className="flex-1 mb-6">
                        <h3 className="text-xl font-semibold mb-2 line-clamp-1" title={name}>{name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                    </div>
                    
                    {isValid ? (
                        <Button asChild className="w-full" variant="secondary">
                            {/* CAMBIO AQUÍ: Pasamos accountId y projectId */}
                            <Link to={`/accprojects/${cleanAccountId}/${cleanProjectId}`}>
                                Open Dashboard
                            </Link>
                        </Button>
                    ) : (
                        <Button disabled className="w-full" variant="ghost">
                            Invalid Data
                        </Button>
                    )}
                </Card>
            );
        })}
      </div>
    </div>
  );
}