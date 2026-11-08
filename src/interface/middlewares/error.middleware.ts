import { type NextFunction, type Request, type Response } from "express";
import { AppError } from "../../application/errors/app.error.ts";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  const message =
    error instanceof Error && error.message
      ? error.message
      : "Internal Server Error";

  res.status(500).json({ error: message });
}
