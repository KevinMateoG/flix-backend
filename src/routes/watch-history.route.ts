import express from "express";
import { type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
  update_watch_progress,
  get_continue_watching,
  get_season_progress,
} from "../controllers/watch-history.controller.ts";

const watchHistoryRouter = express.Router();

watchHistoryRouter.use(authMiddleware);

watchHistoryRouter.post(
  "/update-progress",
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const {
        tmdbId,
        mediaType,
        progressSeconds,
        durationSeconds,
        title,
        posterPath,
        playbackId,
        seasonNumber,
        episodeNumber,
      } = req.body;

      await update_watch_progress({
        profileId: userId,
        userId,
        tmdbId,
        mediaType,
        progressSeconds,
        durationSeconds,
        title,
        posterPath,
        playbackId,
        seasonNumber,
        episodeNumber,
      });

      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

watchHistoryRouter.get("/", async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const data = await get_continue_watching(req.userId, limit);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

watchHistoryRouter.get("/:tmdbId/season/:seasonNumber", async (req: Request, res: Response) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const seasonNumber = Number(req.params.seasonNumber);

    if (isNaN(tmdbId) || isNaN(seasonNumber)) {
      res.status(400).json({ error: "tmdbId and seasonNumber must be numbers" });
      return;
    }

    const data = await get_season_progress(req.userId, tmdbId, seasonNumber);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default watchHistoryRouter;
