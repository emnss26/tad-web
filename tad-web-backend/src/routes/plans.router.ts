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
      .customSanitizer((value) => (Array.isArray(value) ? value : [value]))
      .custom((rows) =>
        rows.every((row: any) => {
          const discipline = row?.discipline ?? row?.Discipline;
          const sheetNumber = row?.sheetNumber ?? row?.SheetNumber;
          return Boolean(String(discipline || "").trim()) && Boolean(String(sheetNumber || "").trim());
        })
      )
      .withMessage("Each row must include discipline/Discipline and sheetNumber/SheetNumber."),
    body("*.discipline").optional().isString(),
    body("*.sheetNumber").optional().isString(),
    body("*.revision").optional().isString(),
    body("*.plannedGenerationDate").optional().isString(),
    body("*.plannedIssueDate").optional().isString(),
    body("*.actualGenerationDate").optional().isString(),
    body("*.actualIssueDate").optional().isString(),
    body("*.sheetName").optional().isString(),
    body("*.Discipline").optional().isString(),
    body("*.SheetNumber").optional().isString(),
    body("*.Revision").optional().isString(),
    body("*.PlannedGenerationDate").optional().isString(),
    body("*.PlannedIssueDate").optional().isString(),
    body("*.ActualGenerationDate").optional().isString(),
    body("*.ActualIssueDate").optional().isString(),
    body("*.SheetName").optional().isString(),
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
