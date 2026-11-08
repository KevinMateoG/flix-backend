import express, { type RequestHandler, type Router } from "express";
import { type LibraryController } from "../controllers/library.controller.ts";

export function createDislikesRouter(
  libraryController: LibraryController,
  authMiddleware: RequestHandler,
): Router {
  const router = express.Router();

  router.use(authMiddleware);
  router.post("/toggle", libraryController.toggleDislike);
  router.get("/check", libraryController.checkDisliked);

  return router;
}
