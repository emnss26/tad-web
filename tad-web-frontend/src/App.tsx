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
import ACC4DDatabasePage from '@/pages/tad-hub/acc/Acc4DDatabasePage';
import Acc5DDatabasePage from '@/pages/tad-hub/acc/Acc5DDatabasePage';
import Acc6DDatabasePage from '@/pages/tad-hub/acc/Acc6DDatabasePage';
import AccProjectPlansPage from '@/pages/tad-hub/acc/AccProjectPlansPage';
import AccTaskManagementPage from '@/pages/tad-hub/acc/AccTaskManagementPage';
import AccLodCheckerPage from '@/pages/tad-hub/acc/AccLodCheckerPage';
import AccVrPage from '@/pages/tad-hub/acc/AccVrPage';

// BIM360
import Bim360ProjectsPage from '@/pages/tad-hub/bim360/Bim360ProjectsPage';
import Bim360ProjectPage from '@/pages/tad-hub/bim360/Bim360ProjectPage';
import Bim360ProjectIssuesPage from '@/pages/tad-hub/bim360/Bim360ProjectIssuesPage'; 
import Bim360ProjectRfisPage from './pages/tad-hub/bim360/Bim360ProjectRfisPage';
import Bim360ProjectUsersPage from './pages/tad-hub/bim360/Bim360ProjectUsersPage';
import Bim3604DDatabasePage from './pages/tad-hub/bim360/Bim3604DDatabasePage';
import Bim3605DDatabasePage from './pages/tad-hub/bim360/Bim3605DDatabasePage';
import Bim3606DDatabasePage from './pages/tad-hub/bim360/Bim3606DDatabasePage';
import Bim360ProjectPlansPage from './pages/tad-hub/bim360/Bim360ProjectPlansPage';
import Bim360TaskManagementPage from './pages/tad-hub/bim360/Bim360TaskManagementPage';
import Bim360LodCheckerPage from './pages/tad-hub/bim360/Bim360LodCheckerPage';
import Bim360VrPage from './pages/tad-hub/bim360/Bim360VrPage';


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
        <Route path="/bim360projects/:accountId/:projectId/b3604ddata" element={<Bim3604DDatabasePage />} />
        <Route path="/bim360projects/:accountId/:projectId/b3605ddata" element={<Bim3605DDatabasePage />} />
        <Route path="/bim360projects/:accountId/:projectId/b3606ddata" element={<Bim3606DDatabasePage />} />
        <Route path="/bim360projects/:accountId/:projectId/plans" element={<Bim360ProjectPlansPage />} />
        <Route path="/bim360projects/:accountId/:projectId/task-manager" element={<Bim360TaskManagementPage />} />
        <Route path="/bim360projects/:accountId/:projectId/lod-checker" element={<Bim360LodCheckerPage />} />
        <Route path="/bim360projects/:accountId/:projectId/vr" element={<Bim360VrPage />} />


        {/* ACC */}
        <Route path="/accprojects/:accountId/:projectId" element={<ACCProjectPage />} />
        <Route path="/accprojects/:accountId/:projectId/users" element={<ACCProjectUsersPage />} />
        <Route path="/accprojects/:accountId/:projectId/issues" element={<ACCProjectIssuesPage />} />
        <Route path="/accprojects/:accountId/:projectId/rfis" element={<ACCProjectRfisPage />} />
        <Route path="/accprojects/:accountId/:projectId/submittals" element={<ACCProjectSubmittalsPage />} />
        <Route path="/accprojects/:accountId/:projectId/acc4ddata" element={<ACC4DDatabasePage />} />
        <Route path="/accprojects/:accountId/:projectId/acc5ddata" element={<Acc5DDatabasePage />} />
        <Route path="/accprojects/:accountId/:projectId/acc6ddata" element={<Acc6DDatabasePage />} />
        <Route path="/accprojects/:accountId/:projectId/plans" element={<AccProjectPlansPage />} />
        <Route path="/accprojects/:accountId/:projectId/task-manager" element={<AccTaskManagementPage />} />
        <Route path="/accprojects/:accountId/:projectId/lod-checker" element={<AccLodCheckerPage />} />
        <Route path="/accprojects/:accountId/:projectId/vr" element={<AccVrPage />} />
        
      
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="p-20 text-center text-red-500 font-bold">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;
