import { type NextFunction, type Request, type Response } from "express";
import { type AuthUseCase } from "../../application/auth.use-case.ts";
import { AppError } from "../../application/errors/app.error.ts";
import { type UserRole } from "../../domain/models/user.ts";

declare module "express-serve-static-core" {
  interface Request {
    userId: string;
    sessionId: string;
    userRole: UserRole;
  }
}

export function createAuthMiddleware(authUseCase: AuthUseCase) {
  return async function authMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const session = await authUseCase.requireSession(req.headers);
      req.userId = session.user.id;
      req.sessionId = session.session.id;
      req.userRole = session.user.role;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createRoleMiddleware(...allowedRoles: UserRole[]) {
  return function roleMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      next(AppError.forbidden("Forbidden"));
      return;
    }
    next();
  };
}

export const requireAdminMiddleware = createRoleMiddleware("admin");