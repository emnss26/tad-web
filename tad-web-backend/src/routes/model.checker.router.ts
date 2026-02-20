import { Router } from "express";
import { body } from "express-validator";
import validate from "../middlewares/validation.middleware";
import {
  deleteDataModel,
  getDataModel,
  patchDataModel,
  postDataModel,
} from "../controllers/model_checker/model.checker.controller";

const router = Router();

const createOrPatchValidators = [
  body("discipline").notEmpty().withMessage("Discipline is required"),
  body("row").notEmpty().withMessage("Row is required").isInt({ min: 1 }),
  body("concept").notEmpty().withMessage("Concept is required"),
  body("req_lod").notEmpty().withMessage("Required Level of Detail is required"),
  body("complet_geometry").notEmpty().withMessage("Completed Geometry is required"),
  body("lod_compliance").notEmpty().withMessage("Level of Detail Compliance is required"),
  body("comments").optional().isString().withMessage("Comments must be a string"),
  body("modelId").optional().isString().withMessage("modelId must be a string"),
  validate,
];

const patchValidators = [
  body("row").notEmpty().withMessage("Row is required").isInt({ min: 1 }),
  body("concept").notEmpty().withMessage("Concept is required"),
  body("req_lod").notEmpty().withMessage("Required Level of Detail is required"),
  body("complet_geometry").notEmpty().withMessage("Completed Geometry is required"),
  body("lod_compliance").notEmpty().withMessage("Level of Detail Compliance is required"),
  body("comments").optional().isString().withMessage("Comments must be a string"),
  body("modelId").optional().isString().withMessage("modelId must be a string"),
  validate,
];

router.post("/:accountId/:projectId/:modelId/model-checker", createOrPatchValidators, postDataModel);
router.post("/:accountId/:projectId/model-checker", createOrPatchValidators, postDataModel);

router.get("/:accountId/:projectId/:modelId/model-checker/:discipline", getDataModel);
router.get("/:accountId/:projectId/model-checker/:discipline", getDataModel);

router.patch("/:accountId/:projectId/:modelId/model-checker/:discipline", patchValidators, patchDataModel);
router.patch("/:accountId/:projectId/model-checker/:discipline", patchValidators, patchDataModel);

router.delete("/:accountId/:projectId/:modelId/model-checker/:discipline", deleteDataModel);
router.delete("/:accountId/:projectId/model-checker/:discipline", deleteDataModel);
router.get("/:accountId/:projectId/:modelId/model-checker", getDataModel);
router.get("/:accountId/:projectId/model-checker", getDataModel);

export default router;
