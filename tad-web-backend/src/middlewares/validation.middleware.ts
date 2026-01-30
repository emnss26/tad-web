import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Middleware para responder 400 si express-validator encontró errores.
 * Úsalo al final del array de validators.
 */
export default function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    data: null,
    error: "ValidationError",
    message: "Invalid request payload",
    details: errors.array(),
  });
}