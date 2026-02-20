import { Request, Response } from "express";
import { ManagementTaskService } from "../../services/management.task.service";
import { getToken } from "../../utils/auth/auth.utils";

function normalizeBodyAsArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") return [body];
  return [];
}

export async function createTask(req: Request, res: Response) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    const { accountId, projectId } = req.params;
    const rows = normalizeBodyAsArray(req.body);

    const saved = await ManagementTaskService.upsertTasks(accountId, projectId, rows);

    if (!saved.length) {
      return res.status(400).json({
        data: [],
        error: "No valid rows",
        message: "Add at least one valid task payload.",
      });
    }

    return res.status(200).json({
      data: saved,
      error: null,
      message: `Processed ${saved.length} tasks successfully.`,
    });
  } catch (err: any) {
    console.error("[TaskController.createTask]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Server error while creating tasks.",
      message: "Server error while creating tasks.",
    });
  }
}

export async function getAllTasks(req: Request, res: Response) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    const { accountId, projectId } = req.params;
    const tasks = await ManagementTaskService.getTasks(accountId, projectId);

    return res.status(200).json({
      data: tasks,
      error: null,
      message: "Tasks retrieved successfully.",
    });
  } catch (err: any) {
    console.error("[TaskController.getAllTasks]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Server error while fetching tasks.",
      message: "Server error while fetching tasks.",
    });
  }
}

export async function updateTask(req: Request, res: Response) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    const { accountId, projectId, id } = req.params;
    const updated = await ManagementTaskService.updateTask(accountId, projectId, id, req.body || {});

    if (!updated) {
      return res.status(404).json({
        data: null,
        error: "Not Found",
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      data: updated,
      error: null,
      message: "Task updated successfully.",
    });
  } catch (err: any) {
    console.error("[TaskController.updateTask]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Server error while updating the task.",
      message: "Server error while updating the task.",
    });
  }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({
        data: null,
        error: "Unauthorized",
        message: "Authorization token is required.",
      });
    }

    const { accountId, projectId, id } = req.params;
    const deleted = await ManagementTaskService.deleteTask(accountId, projectId, id);

    if (!deleted) {
      return res.status(404).json({
        data: null,
        error: "Not Found",
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      data: null,
      error: null,
      message: "Task deleted successfully.",
    });
  } catch (err: any) {
    console.error("[TaskController.deleteTask]", err);
    return res.status(500).json({
      data: null,
      error: err.message || "Server error while deleting the task.",
      message: "Server error while deleting the task.",
    });
  }
}
