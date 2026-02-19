import { Router } from 'express';
import { GetProjectFolderTree } from '../controllers/dm/dm.folders.controller';
import { GetProjectModelFiles } from '../controllers/dm/dm.files.controller';
import { GetFoldersStructure } from '../controllers/dm/dm.project.folders.controller';
import { GetFileData } from '../controllers/dm/dm.items.controller';
import { GetFileRevisionStatus } from '../controllers/dm/dm.files.reviews.controller';
import {
  GetFederatedModel,
  GetGLBFederatedModel,
  GetIFCFederatedModel,
} from '../controllers/dm/dm.federated.controller';

const router = Router();


router.get('/projects/:projectId/folders-tree', GetProjectFolderTree);
router.get('/projects/:projectId/model-files', GetProjectModelFiles);
router.get('/folders/:accountId/:projectId/folder-structure', GetFoldersStructure);
router.post('/items/:accountId/:projectId/file-data', GetFileData);
router.post('/items/:accountId/:projectId/file-revisions', GetFileRevisionStatus);
router.get('/items/:accountId/:projectId/federatedmodel', GetFederatedModel);
router.get('/items/:accountId/:projectId/federated-ifc', GetIFCFederatedModel);
router.get('/items/:accountId/:projectId/federated-glb', GetGLBFederatedModel);

export default router;
