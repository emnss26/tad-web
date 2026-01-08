import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Settings, Box, Check, ChevronsUpDown, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthService } from "@/services/auth.service";
import { AccService } from "@/services/acc.service";
import { Bim360Service } from "@/services/bim360.service";
import { cn } from "@/lib/utils";

interface UserProfile {
  name: string;
  email: string;
  picture?: string;
}

interface Project {
  id: string;
  name: string;
  accountId?: string;
  relationships?: { hub: { data: { id: string } } };
}

export function HubHeader({ projectId }: { projectId?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // --- Project Selector State ---
  const [openProjectSelector, setOpenProjectSelector] = useState(false);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [currentProjectName, setCurrentProjectName] = useState<string>("Select Project");
  const [platform, setPlatform] = useState<'acc' | 'bim360' | null>(null);

  // 1. Detectar Plataforma y Cargar Usuario
  useEffect(() => {
    // Detectar plataforma basado en URL
    if (location.pathname.includes("/accprojects")) {
      setPlatform('acc');
    } else if (location.pathname.includes("/bim360projects")) {
      setPlatform('bim360');
    } else {
      setPlatform(null);
    }

    const fetchUser = async () => {
      try {
        const userData = await AuthService.getUserProfile();
        setUserProfile(userData);
      } catch (error) {
        console.error("Error loading user profile", error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [location.pathname]);

  // 2. Cargar Lista de Proyectos (Si estamos en una plataforma)
  useEffect(() => {
    const loadProjects = async () => {
      if (!platform) return;
      try {
        let data: any;
        if (platform === 'acc') {
          data = await AccService.getProjects();
        } else {
          data = await Bim360Service.getProjects();
        }
        
        // Normalizar respuesta: a veces es data.projects, a veces array directo
        const list = Array.isArray(data) ? data : (data.projects || []);
        setProjectsList(list);

        // Si hay un projectId seleccionado, buscar su nombre
        if (projectId) {
            // Nota: Los IDs a veces tienen prefijos 'b.', normalizamos para comparar
            const cleanCurrentId = projectId.replace(/^b\./, '');
            const found = list.find((p: any) => p.id.replace(/^b\./, '') === cleanCurrentId);
            if (found) {
                // ACC suele tener el nombre en attributes.name (JSON:API) o name directo
                setCurrentProjectName(found.name || found.attributes?.name || projectId);
            }
        }
      } catch (error) {
        console.error("Error loading projects list for selector", error);
      }
    };

    // Solo cargamos si hay una plataforma activa
    if (platform) {
        loadProjects();
    }
  }, [platform, projectId]);


  // --- Handlers ---

  const handleProjectSelect = (project: any) => {
    setOpenProjectSelector(false);
    
    // Lógica para extraer IDs limpios (igual que en tus Pages)
    let rawAccountId = project.accountId || project.relationships?.hub?.data?.id || "";
    const cleanAccountId = rawAccountId.replace(/^b\./, '');
    
    let rawProjectId = project.id;
    const cleanProjectId = rawProjectId.replace(/^b\./, '');

    // Construir URL según plataforma
    const basePath = platform === 'acc' ? '/accprojects' : '/bim360projects';
    navigate(`${basePath}/${cleanAccountId}/${cleanProjectId}`);
  };

  const handleLogout = async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/'; 
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <header className="h-16 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between z-50 sticky top-0">
      
      {/* Left: Brand & Context */}
      <div className="flex items-center gap-4 md:gap-8">
        <Link to="/hub/select-platform" className="flex items-center gap-2 font-bold text-lg text-primary hover:opacity-80 transition-opacity">
          {/* Logo pequeño opcional */}
          <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <span className="hidden md:inline-block">BIM Technical Automation Dashboard HUB</span>
        </Link>
        
        {/* === PROJECT SELECTOR === */}
        {platform && (
            <Popover open={openProjectSelector} onOpenChange={setOpenProjectSelector}>
            <PopoverTrigger asChild>
                <Button
                variant="outline"
                role="combobox"
                aria-expanded={openProjectSelector}
                className="w-[250px] justify-between hidden md:flex"
                >
                <span className="truncate">
                    {projectId ? currentProjectName : "Select a project..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                <CommandInput placeholder="Search project..." />
                <CommandList>
                    <CommandEmpty>No project found.</CommandEmpty>
                    <CommandGroup heading={platform === 'acc' ? "Autodesk Build Projects" : "BIM 360 Projects"}>
                    {projectsList.map((project: any) => {
                        const pName = project.name || project.attributes?.name || "Untitled";
                        // Verificar si es el seleccionado
                        const isSelected = projectId && project.id.includes(projectId); 
                        
                        return (
                            <CommandItem
                                key={project.id}
                                value={pName} // Para búsqueda por nombre
                                onSelect={() => handleProjectSelect(project)}
                            >
                                <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                )}
                                />
                                {pName}
                            </CommandItem>
                        );
                    })}
                    </CommandGroup>
                </CommandList>
                </Command>
            </PopoverContent>
            </Popover>
        )}
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full focus:ring-2 focus:ring-primary/20">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={userProfile?.picture} alt={userProfile?.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {loadingUser ? "..." : getInitials(userProfile?.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">
                    {loadingUser ? "Loading..." : userProfile?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                    {loadingUser ? "..." : userProfile?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/hub/select-platform')} className="cursor-pointer">
              <Box className="mr-2 h-4 w-4" />
              <span>Switch Platform</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}