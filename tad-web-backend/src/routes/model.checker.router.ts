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

router.post(
  "/:accountId/:projectId/model-checker",
  [
    body("discipline").notEmpty().withMessage("Discipline is required"),
    body("row").notEmpty().withMessage("Row is required").isInt({ min: 1 }),
    body("concept").notEmpty().withMessage("Concept is required"),
    body("req_lod").notEmpty().withMessage("Required Level of Detail is required"),
    body("complet_geometry").notEmpty().withMessage("Completed Geometry is required"),
    body("lod_compliance").notEmpty().withMessage("Level of Detail Compliance is required"),
    body("comments").optional().isString().withMessage("Comments must be a string"),
    validate,
  ],
  postDataModel
);

router.get("/:accountId/:projectId/model-checker/:discipline", getDataModel);

router.patch(
  "/:accountId/:projectId/model-checker/:discipline",
  [
    body("row").notEmpty().withMessage("Row is required").isInt({ min: 1 }),
    body("concept").notEmpty().withMessage("Concept is required"),
    body("req_lod").notEmpty().withMessage("Required Level of Detail is required"),
    body("complet_geometry").notEmpty().withMessage("Completed Geometry is required"),
    body("lod_compliance").notEmpty().withMessage("Level of Detail Compliance is required"),
    body("comments").optional().isString().withMessage("Comments must be a string"),
    validate,
  ],
  patchDataModel
);

router.delete("/:accountId/:projectId/model-checker/:discipline", deleteDataModel);
router.get("/:accountId/:projectId/model-checker", getDataModel);

export default router;
