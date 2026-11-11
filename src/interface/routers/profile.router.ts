import express, { type RequestHandler, type Router } from "express";
import { type ProfileController } from "../controllers/profile.controller.ts";
import { avatarUploadMiddleware } from "../middlewares/avatar-upload.middleware.ts";

export function createProfileRouter(
  profileController: ProfileController,
  authMiddleware: RequestHandler,
): Router {
  const router = express.Router();

  router.use(authMiddleware);
  router.get("/me", profileController.getMe);
  router.patch("/region", profileController.updateRegion);
  router.patch("/settings", profileController.updateSettings);
  router.post("/avatar", avatarUploadMiddleware, profileController.uploadAvatar);
  router.put("/avatar", avatarUploadMiddleware, profileController.uploadAvatar);
  router.delete("/avatar", profileController.deleteAvatar);

  return router;
}
