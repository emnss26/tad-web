import { Router } from "express";
import { body } from "express-validator";
import validate from "../middlewares/validation.middleware"; // el tuyo
import {
  postModelData,
  getModelData,
  patchModelData,
} from "../controllers/model_data/modeldata.controller";

const router = Router();

router.post(
  "/:accountId/:projectId/models/:modelId/data",
  [
    body().custom(val => Array.isArray(val) || (val && typeof val === "object"))
      .withMessage("Body must be an object or array")
      .customSanitizer(v => (Array.isArray(v) ? v : [v])),
    body("*.dbId").notEmpty().withMessage("dbId is required"),
    validate,
  ],
  postModelData
);

router.get("/:accountId/:projectId/models/:modelId/data", getModelData);

router.patch(
  "/:accountId/:projectId/models/:modelId/data/:dbId",
  [
    body("field").notEmpty().withMessage("field is required"),
    body("value").exists().withMessage("value is required"),
    validate,
  ],
  patchModelData
);

export default router;