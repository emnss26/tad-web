import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut,  Settings, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Importar tu servicio de proyectos aquí si lo necesitas
// import { fetchACCProjectsData } from ...

export function HubHeader({ projectId }: { projectId?: string }) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

  // Simulación de fetch de usuario (puedes conectar tu API real aquí)
  useEffect(() => {
    // Ejemplo rápido. En producción usarías tu fetch al backend real.
    const mockUser = { name: "Architect User", email: "user@tadhub.com" };
    setUserProfile(mockUser);
  }, []);

  const handleLogout = async () => {
    try {
        // Asumiendo que tu backend tiene este endpoint configurado
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/'; 
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  return (
    <header className="h-16 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between z-10 sticky top-0">
      
      {/* Left: Brand & Context */}
      <div className="flex items-center gap-6">
        <Link to="/hub/select-platform" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Box className="h-6 w-6" />
          <span>TAD HUB</span>
        </Link>
        
        {/* Aquí iría tu selector de proyectos (Dropdown) si estás dentro de un proyecto */}
        {projectId && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-sm font-medium">
                <span className="text-muted-foreground">Project:</span>
                <span>{projectId}</span> {/* Reemplazar con nombre real */}
            </div>
        )}
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/avatars/01.png" alt={userProfile?.name} />
                <AvatarFallback>{userProfile?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/hub/select-platform')}>
              <Box className="mr-2 h-4 w-4" />
              <span>Switch Platform</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}