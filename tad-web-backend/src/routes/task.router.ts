import { Router } from "express";
import { body } from "express-validator";
import validate from "../middlewares/validation.middleware";
import { createTask, deleteTask, getAllTasks, updateTask } from "../controllers/task/task.controller";

const router = Router();

router.post(
  "/:accountId/:projectId/tasks",
  [
    body()
      .custom((value) => Array.isArray(value) || (value && typeof value === "object"))
      .withMessage("Body must be an object or array")
      .customSanitizer((value) => (Array.isArray(value) ? value : [value])),
    body("*.id").notEmpty().withMessage("id is required"),
    body("*.title").optional().isString(),
    body("*.description").optional().isString(),
    body("*.status").optional().isString(),
    body("*.startDate").optional().isString(),
    body("*.endDate").optional().isString(),
    body("*.assignedTo").optional().isString(),
    validate,
  ],
  createTask
);

router.get("/:accountId/:projectId/tasks", getAllTasks);

router.patch(
  "/:accountId/:projectId/tasks/:id",
  [
    body().custom((v) => Object.keys(v || {}).length > 0).withMessage("Body cannot be empty"),
    body("title").optional().isString(),
    body("description").optional().isString(),
    body("status").optional().isString(),
    body("startDate").optional().isString(),
    body("endDate").optional().isString(),
    body("assignedTo").optional().isString(),
    validate,
  ],
  updateTask
);

router.delete("/:accountId/:projectId/tasks/:id", deleteTask);

export default router;
