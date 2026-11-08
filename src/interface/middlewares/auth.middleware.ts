import { type NextFunction, type Request, type Response } from "express";
import { type AuthUseCase } from "../../application/auth.use-case.ts";

declare module "express-serve-static-core" {
  interface Request {
    userId: string;
    sessionId: string;
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
      next();
    } catch (error) {
      next(error);
    }
  };
}
