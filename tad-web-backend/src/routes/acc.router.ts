import { Router } from 'express';
import { GetAccProjects } from '../controllers/acc/projects.controller';
import { GetProject } from '../controllers/acc/project.controller';
import { GetProjectUsers } from '../controllers/acc/project.users.controller';
import { GetIssues } from '../controllers/acc/project.issues.controller';

const router = Router();

// GET /api/acc/projects
router.get('/projects', GetAccProjects);
router.get('/projects/:projectId', GetProject);
router.get('/projects/:projectId/users', GetProjectUsers);
router.get('/projects/:projectId/issues', GetIssues);


export default router;