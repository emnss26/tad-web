import { Router } from "express";
import {
  GetAECModelParametersByCategory,
  GetAECModels,
  GetAECProjects,
  GetLastDisciplineByModel,
  GetLastParameterCheck,
  GetLatestProjectWbs,
  GetLatestWbsModelMatching,
  GetProjectParameterCompliance,
  RunWbsModelMatching,
  SaveParameterCheck,
  SaveProjectWbs,
} from "../controllers/aec/aec.controller";

const router = Router();

router.get("/graphql-projects", GetAECProjects);
router.get("/:projectId/graphql-models", GetAECModels);
router.get("/:projectId/graphql-model-parameters", GetAECModelParametersByCategory);

router.post("/:projectId/parameters/save-check", SaveParameterCheck);
router.get("/:projectId/parameters/last-check", GetLastParameterCheck);
router.get("/:projectId/parameters/last-discipline", GetLastDisciplineByModel);
router.get("/:projectId/parameters/project-compliance", GetProjectParameterCompliance);

router.post("/:projectId/wbs/save", SaveProjectWbs);
router.get("/:projectId/wbs/latest", GetLatestProjectWbs);
router.post("/:projectId/wbs/match/run", RunWbsModelMatching);
router.get("/:projectId/wbs/match/latest", GetLatestWbsModelMatching);

export default router;

