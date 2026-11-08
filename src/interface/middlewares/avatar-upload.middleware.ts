import { type NextFunction, type Request, type Response } from "express";
import multer, { MulterError } from "multer";
import { AppError } from "../../application/errors/app.error.ts";
import { MAX_AVATAR_SIZE_BYTES } from "../../application/profile.use-case.ts";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE_BYTES, files: 1 },
}).single("avatar");

export function avatarUploadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new AppError("avatar must be 2MB or smaller", 413));
        return;
      }
      next(AppError.badRequest(`Invalid upload: ${error.message}`));
      return;
    }
    next(error);
  });
}
