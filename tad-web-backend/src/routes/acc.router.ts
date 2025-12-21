import { Router } from 'express';
import { ProjectsController } from '../controllers/acc/projects.controller';

const router = Router();

router.get('/', ProjectsController.getAccProjects);

export default router;