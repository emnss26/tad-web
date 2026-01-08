import { Outlet, useParams } from 'react-router-dom';
import { HubHeader } from '@/components/hub/HubHeader';
import { HubSidebar } from '@/components/hub/HubSidebar';

export const HubLayout = () => {
  // Detectamos si estamos dentro de un proyecto específico para mostrar el sidebar
  const { projectId } = useParams();
  const showSidebar = !!projectId;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
      
      {/* 1. Header (Siempre visible, ocupa todo el ancho superior) */}
      <div className="z-50 w-full border-b bg-background">
         <HubHeader projectId={projectId} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. Sidebar (Solo se muestra si hay proyecto seleccionado) */}
        {showSidebar && (
            <div className="h-full border-r bg-card">
                <HubSidebar />
            </div>
        )}

        {/* 3. Contenido Principal (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-6 bg-muted/10 relative">
          <div className={`h-full ${!showSidebar ? 'max-w-7xl mx-auto w-full' : ''}`}>
             <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};