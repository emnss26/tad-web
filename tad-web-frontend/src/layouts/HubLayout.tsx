import { Outlet, useParams } from 'react-router-dom';
import { HubHeader } from '@/components/hub/HubHeader';
import { HubSidebar } from '@/components/hub/HubSidebar';

export const HubLayout = () => {
  // Detectamos si estamos dentro de un proyecto específico
  const { projectId } = useParams();
  const showSidebar = !!projectId;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      
      {/* El Sidebar solo se renderiza si hay un proyecto seleccionado */}
      {showSidebar && <HubSidebar />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        {/* El Header siempre está presente */}
        <HubHeader projectId={projectId} />

        {/* Contenido Principal */}
        <main className={`flex-1 overflow-y-auto p-6 bg-muted/10 ${!showSidebar ? 'flex flex-col' : ''}`}>
          <div className={`h-full ${!showSidebar ? 'max-w-7xl mx-auto w-full' : ''}`}>
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};