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
import ACCProjectUsersPage from '@/pages/tad-hub/acc/ProjectUsersPage';
import ACCProjectIssuesPage from '@/pages/tad-hub/acc/ProjectIssuesPage';
import ACCProjectRfisPage from '@/pages/tad-hub/acc/ProjectRfisPage';
import ACCProjectSubmittalsPage from '@/pages/tad-hub/acc/ProjectSubmittalsPage';

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

        <Route path="/accprojects/:projectId" element={<ACCProjectPage />} />
        <Route path="/accprojects/:projectId/users" element={<ACCProjectUsersPage />} />
        <Route path="/accprojects/:projectId/issues" element={<ACCProjectIssuesPage />} />
        <Route path="/accprojects/:projectId/rfis" element={<ACCProjectRfisPage />} />
        <Route path="/accprojects/:projectId/submittals" element={<ACCProjectSubmittalsPage />} />
        
      
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="p-20 text-center text-red-500 font-bold">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;