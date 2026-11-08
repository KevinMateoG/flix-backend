import express, { type RequestHandler, type Router } from "express";
import { type LibraryController } from "../controllers/library.controller.ts";

export function createMyListRouter(
  libraryController: LibraryController,
  authMiddleware: RequestHandler,
): Router {
  const router = express.Router();

  router.use(authMiddleware);
  router.get("/", libraryController.getMyList);
  router.post("/toggle", libraryController.toggleMyList);
  router.get("/check", libraryController.checkMyList);
  router.delete("/:itemId", libraryController.removeFromMyList);

  return router;
}
