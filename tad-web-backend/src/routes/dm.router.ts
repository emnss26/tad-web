import { Router } from 'express';
import { GetProjectFolderTree } from '../controllers/dm/dm.folders.controller';
import { GetProjectModelFiles } from '../controllers/dm/dm.files.controller';

const router = Router();


router.get('/projects/:projectId/folders-tree', GetProjectFolderTree);
router.get('/projects/:projectId/model-files', GetProjectModelFiles);

export default router;