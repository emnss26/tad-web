import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Search, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Definición de tipos para los proyectos que vienen del backend
interface Project {
  id: string;
  platform: string;
  name: string;
  // Ajusta según la estructura real de tu backend si difiere
  accountId?: string; // Si el backend lo devuelve plano
  relationships?: {
    hub: { data: { id: string } }; // Si viene anidado estilo JSON:API
  };
  attributes?: {
    name: string;
    description?: string;
  };
}

export default function ACCProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch de proyectos reales
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Nota: En Vite, el proxy maneja /api, así que fetch('/api/...') va al backend
        const response = await fetch("/api/acc/projects", {
    
            credentials: 'include' 
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Session expired. Please login again.");
          }
          throw new Error("Failed to load projects.");
        }

        const json = await response.json();
        // El backend devuelve { data: { projects: [] } } o similar. Ajustar según respuesta real.
        const projectsList = json.data?.projects || json.data || []; 
        setProjects(projectsList);
      } catch (err: any) {
        console.error("Error fetching ACC projects:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filtrado simple por nombre en el cliente
  const filteredProjects = projects.filter((p) => {
    // Normalizamos nombre: puede venir en 'name' (plano) o 'attributes.name' (JSON:API)
    const name = p.name || p.attributes?.name || "Untitled Project";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Search */}
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

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading projects...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProjects.length === 0 && (
        <div className="text-center py-20 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
            // Extracción segura de datos (Soporta estructura plana o JSON:API)
            const name = project.name || project.attributes?.name || "Unknown Project";
            const description = project.attributes?.description || "No description available";
            // El ID del hub/account es necesario para la URL. 
            // Si el backend limpia la data, vendrá como 'accountId'. 
            // Si viene crudo de Autodesk, estará en 'relationships.hub.data.id'.
            // Aseguramos quitar el prefijo "b." si viene sucio para la URL limpia.
            const rawHubId = project.accountId || project.relationships?.hub?.data?.id || "";
            const accountId = rawHubId.replace(/^b\./, ''); 
            const projectId = project.id.replace(/^b\./, ''); // Project ID también a veces trae prefijo

            return (
                <Card key={project.id} className="p-6 hover:shadow-md transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                        {/* Badge opcional si quisieras mostrar estatus */}
                    </div>
                    
                    <div className="flex-1 mb-6">
                        <h3 className="text-xl font-semibold mb-2 line-clamp-1" title={name}>{name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2" title={description}>{description}</p>
                    </div>
                    
                    <Button asChild className="w-full" variant="secondary">
                        <Link to={`/accprojects/${accountId}/${projectId}`}>
                            Open Dashboard
                        </Link>
                    </Button>
                </Card>
            );
        })}
      </div>
    </div>
  );
}