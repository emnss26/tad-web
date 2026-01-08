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
import ACCProjectsPage from '@/pages/tad-hub/acc/AccProjectsPage';
import ACCProjectPage from '@/pages/tad-hub/acc/AccProjectPage';
import ACCProjectUsersPage from '@/pages/tad-hub/acc/AccProjectUsersPage';
import ACCProjectIssuesPage from '@/pages/tad-hub/acc/AccProjectIssuesPage';
import ACCProjectRfisPage from '@/pages/tad-hub/acc/AccProjectRfisPage';
import ACCProjectSubmittalsPage from '@/pages/tad-hub/acc/AccProjectSubmittalsPage';

// BIM360
import Bim360ProjectsPage from '@/pages/tad-hub/bim360/Bim360ProjectsPage';
import Bim360ProjectPage from '@/pages/tad-hub/bim360/Bim360ProjectPage';
import Bim360ProjectIssuesPage from '@/pages/tad-hub/bim360/Bim360ProjectIssuesPage'; 
import Bim360ProjectRfisPage from './pages/tad-hub/bim360/Bim360ProjectRfisPage';
import Bim360ProjectUsersPage from './pages/tad-hub/bim360/Bim360ProjectUsersPage';


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
        <Route path="/bim360projects" element={<Bim360ProjectsPage />} />

        {/* -- Nivel 2: Con Sidebar (projectId definido) -- */}
        
        {/* BIM 360 */}
        <Route path="/bim360projects/:accountId/:projectId" element={<Bim360ProjectPage />} />
        <Route path="/bim360projects/:accountId/:projectId/users" element={<Bim360ProjectUsersPage />} />
        <Route path="/bim360projects/:accountId/:projectId/issues" element={<Bim360ProjectIssuesPage />} />
        <Route path="/bim360projects/:accountId/:projectId/rfis" element={<Bim360ProjectRfisPage />} />


        {/* ACC */}
        <Route path="/accprojects/:accountId/:projectId" element={<ACCProjectPage />} />
        <Route path="/accprojects/:accountId/:projectId/users" element={<ACCProjectUsersPage />} />
        <Route path="/accprojects/:accountId/:projectId/issues" element={<ACCProjectIssuesPage />} />
        <Route path="/accprojects/:accountId/:projectId/rfis" element={<ACCProjectRfisPage />} />
        <Route path="/accprojects/:accountId/:projectId/submittals" element={<ACCProjectSubmittalsPage />} />
        
      
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="p-20 text-center text-red-500 font-bold">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;