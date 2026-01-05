import { Router } from 'express';
import { GetBim360Projects } from '../controllers/bim360/bim360.projects.controller';
import { GetBim360Project } from '../controllers/bim360/bim360.project.controller';
import { GetBim360ProjectUsers } from '../controllers/bim360/bim360.project.users.controller';
import { GetBim360Issues } from '../controllers/bim360/bim360.project.issues.controller';
import { GetBim360Rfis } from '../controllers/bim360/bim360.project.rfis.controller';

const router = Router();

// Rutas base: /api/bim360 (definido en server.ts)

// 1. Proyectos
router.get('/projects', GetBim360Projects);
router.get('/projects/:projectId', GetBim360Project);

// 2. Recursos del Proyecto
router.get('/projects/:projectId/users', GetBim360ProjectUsers);
router.get('/projects/:projectId/issues', GetBim360Issues);
router.get('/projects/:projectId/rfis', GetBim360Rfis);

export default router;