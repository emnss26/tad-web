import { Router } from "express";
import { body } from "express-validator";
import validate from "../middlewares/validation.middleware";
import {
  deleteDataModel,
  getDataModel,
  patchDataModel,
  postDataModel,
} from "../controllers/plans/plans.controller";

const router = Router();

router.post(
  "/:accountId/:projectId/plans",
  [
    body()
      .custom((value) => Array.isArray(value) || (value && typeof value === "object"))
      .withMessage("Body must be an object or array")
      .customSanitizer((value) => (Array.isArray(value) ? value : [value])),
    body("*.Id").optional().isString(),
    body("*.SheetName").optional().isString(),
    body("*.SheetNumber").optional().isString(),
    body("*.Discipline").optional().isString(),
    body("*.Revision").optional().isString(),
    body("*.LastModifiedDate").optional().isString(),
    body("*.InFolder").optional().isBoolean(),
    body("*.InARevisionProcess").optional().isString(),
    body("*.RevisionStatus").optional().isString(),
    validate,
  ],
  postDataModel
);

router.get("/:accountId/:projectId/plans", getDataModel);

router.patch(
  "/:accountId/:projectId/data/:Id",
  [
    body("field").notEmpty().withMessage("field is required"),
    body("value").exists().withMessage("value is required"),
    validate,
  ],
  patchDataModel
);

router.delete(
  "/:accountId/:projectId/plans",
  [body("ids").isArray({ min: 1 }).withMessage("ids array required"), validate],
  deleteDataModel
);

export default router;

