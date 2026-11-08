import express, { type RequestHandler, type Router } from "express";
import { type HistoryController } from "../controllers/history.controller.ts";

export function createWatchHistoryRouter(
  historyController: HistoryController,
  authMiddleware: RequestHandler,
): Router {
  const router = express.Router();

  router.use(authMiddleware);
  router.post("/update-progress", historyController.updateProgress);
  router.get("/", historyController.getContinueWatching);
  router.get(
    "/:tmdbId/season/:seasonNumber",
    historyController.getSeasonProgress,
  );

  return router;
}
