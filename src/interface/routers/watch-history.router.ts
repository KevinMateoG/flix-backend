import express, { type RequestHandler, type Router } from "express";
import { type HistoryController } from "../controllers/history.controller.ts";

export function createWatchHistoryRouter(
  historyController: HistoryController,
  authMiddleware: RequestHandler,
): Router {
  const router = express.Router();

  router.use(authMiddleware);
  router.post("/update-progress", historyController.updateProgress);
  router.post("/", historyController.updateProgress);
  router.get("/", historyController.getContinueWatching);
  router.get(
    "/:tmdbId/season/:seasonNumber",
    historyController.getSeasonProgress,
  );
  router.get("/:id", historyController.getHistoryItemById);
  router.patch("/:id", historyController.updateHistoryItem);
  router.put("/:id", historyController.updateHistoryItem);
  router.delete("/:id", historyController.deleteHistoryItem);

  return router;
}