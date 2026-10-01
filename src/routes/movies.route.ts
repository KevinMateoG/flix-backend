import express, { type Request, type Response } from "express";
import get_movies from "../controllers/getmovies.controller.ts";
import {
  is_title_playable,
  get_playable_content,
  get_stream_url,
} from "../controllers/playable-content.controller.ts";

export const moviesRouter = express.Router();

moviesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const region = req.query.region as string | undefined;
    const movies = await get_movies(region);
    res.json(movies);
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

moviesRouter.get("/:tmdbId/playable", async (req: Request, res: Response) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const region = (req.query.region as string) || "US";

    if (isNaN(tmdbId)) {
      res.status(400).json({ error: "tmdbId must be a number" });
      return;
    }

    const playable = await is_title_playable(tmdbId, region);
    res.json({ playable });
  } catch (error: any) {
    console.error("Error checking playability:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

moviesRouter.get("/:tmdbId/stream", async (req: Request, res: Response) => {
  try {
    const tmdbId = Number(req.params.tmdbId);

    if (isNaN(tmdbId)) {
      res.status(400).json({ error: "tmdbId must be a number" });
      return;
    }

    const content = await get_playable_content(tmdbId);
    if (!content) {
      res
        .status(404)
        .json({ error: "No playable content found for this tmdbId" });
      return;
    }

    const streamUrl = await get_stream_url(tmdbId);
    res.json({
      tmdbId: content.tmdbId,
      muxPlaybackId: content.muxPlaybackId,
      muxAssetId: content.muxAssetId,
      availableRegions: content.availableRegions,
      streamUrl,
    });
  } catch (error: any) {
    console.error("Error fetching stream info:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

export default moviesRouter;
