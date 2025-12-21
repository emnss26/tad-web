import { Router } from 'express';
import { ProjectsController } from '../controllers/acc/projects.controller';

const router = Router();

// GET /api/acc/projects
router.get('/projects', ProjectsController.getAccProjects);

export default router;