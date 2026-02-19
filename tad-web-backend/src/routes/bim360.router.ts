import { Router } from 'express';
import { GetBim360Projects } from '../controllers/bim360/bim360.projects.controller';
import { GetBim360Project} from '../controllers/bim360/bim360.project.controller';
import { GetBim360ProjectUsers } from '../controllers/bim360/bim360.project.users.controller';
import { GetBim360Issues } from '../controllers/bim360/bim360.project.issues.controller';
import { GetBim360Rfis } from '../controllers/bim360/bim360.project.rfis.controller';

const router = Router();

// GET /api/bim360/projects
router.get('/projects', GetBim360Projects);
router.get('/projects/:projectId', GetBim360Project);
router.get('/projects/:projectId/users', GetBim360ProjectUsers);
router.get('/projects/:projectId/issues', GetBim360Issues);
router.get('/projects/:projectId/rfis', GetBim360Rfis);

export default router;
