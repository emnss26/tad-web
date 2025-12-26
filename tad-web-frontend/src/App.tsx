import { Routes, Route } from 'react-router-dom';

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import { HubLayout } from '@/layouts/HubLayout';

// Pages - Public
import HomePage from '@/pages/HomePage';
import SolutionsPage from '@/pages/SolutionsPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';

// Pages - Auth
import HubLoginPage from '@/pages/tad-hub/HubLoginPage';

// Pages - Hub
import SelectPlatformPage from '@/pages/tad-hub/SelectPlatformPage';

// ACC 
import ACCProjectsPage from '@/pages/tad-hub/acc/ProjectsPage';
import ACCProjectPage from '@/pages/tad-hub/acc/ProjectPage';

function App() {
  return (
    <Routes>
      {/* 1. Marketing / Público */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* 2. Login (Sin Layout) */}
      <Route path="/login" element={<div>Login General Placeholder</div>} />
      <Route path="/hub/login" element={<HubLoginPage />} />
      
      {/* 3. El HUB (App Interna) */}
      <Route element={<HubLayout />}>
        
        {/* -- Nivel 1: Sin Sidebar (projectId es undefined) -- */}
        
        {/* Selección de Plataforma */}
        <Route path="/hub/select-platform" element={<SelectPlatformPage />} />
        
        {/* Lista de Proyectos (ACC y BIM360) */}
        <Route path="/accprojects" element={<ACCProjectsPage />} />
        <Route path="/bim360projects" element={<div>BIM360 Projects Placeholder</div>} />

        <Route path="/accprojects/:accountId/:projectId" element={<ACCProjectPage />} />
        

        {/* -- Nivel 2: Con Sidebar (projectId existe en la URL) -- */}
        
        {/* Dashboard y Módulos Internos */}
        
        <Route path="/accprojects/:accountId/:projectId" element={<div className="text-2xl font-bold">Project Dashboard</div>} />
        <Route path="/accprojects/:accountId/:projectId/accusers" element={<div>Users Report Module</div>} />
        <Route path="/accprojects/:accountId/:projectId/accissues" element={<div>Issues Report Module</div>} />
        {/* ... más rutas internas ... */}
      
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="p-20 text-center text-red-500 font-bold">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;