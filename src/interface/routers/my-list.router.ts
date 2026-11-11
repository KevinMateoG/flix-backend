import express, { type RequestHandler, type Router } from "express";
import { type LibraryController } from "../controllers/library.controller.ts";

export function createMyListRouter(
  libraryController: LibraryController,
  authMiddleware: RequestHandler,
): Router {
  const router = express.Router();

  router.use(authMiddleware);
  router.get("/", libraryController.getMyList);
  router.get("/check", libraryController.checkMyList);
  router.get("/:itemId", libraryController.getMyListItemById);
  router.post("/", libraryController.createMyListItem);
  router.post("/toggle", libraryController.toggleMyList);
  router.patch("/:itemId", libraryController.updateMyListItem);
  router.put("/:itemId", libraryController.updateMyListItem);
  router.delete("/:itemId", libraryController.removeFromMyList);

  return router;
}