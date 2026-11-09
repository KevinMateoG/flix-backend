import { type NextFunction, type Request, type Response } from "express";
import { type AdminUseCase } from "../../application/admin.use-case.ts";
import { type UpdateAdminUserInput } from "../../domain/models/user.ts";

export class AdminController {
  private readonly adminUseCase: AdminUseCase;

  constructor(adminUseCase: AdminUseCase) {
    this.adminUseCase = adminUseCase;
  }

  ping = (_req: Request, res: Response): void => {
    res.json({ ok: true, role: "admin" });
  };

  getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page;
      const limit = req.query.limit;

      const result = await this.adminUseCase.getUsers({
        search,
        role,
        status,
        page,
        limit,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = String(req.params.id ?? "");
      const user = await this.adminUseCase.getUserById(id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = String(req.params.id ?? "");
      const body = (req.body ?? {}) as UpdateAdminUserInput;
      const updated = await this.adminUseCase.updateUser(req.userId, id, body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = String(req.params.id ?? "");
      const result = await this.adminUseCase.deleteUser(req.userId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
