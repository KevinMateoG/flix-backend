import express, { type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
  toggle_dislike,
  check_if_disliked,
} from "../controllers/dislikes.controller.ts";

const dislikesRouter = express.Router();

dislikesRouter.use(authMiddleware);

dislikesRouter.post("/toggle", async (req: Request, res: Response) => {
  try {
    const { tmdbId, mediaType } = req.body;

    if (!tmdbId || !mediaType) {
      res.status(400).json({ error: "tmdbId and mediaType are required" });
      return;
    }

    const result = await toggle_dislike(req.userId, Number(tmdbId), mediaType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

dislikesRouter.get("/check", async (req: Request, res: Response) => {
  try {
    const tmdbId = Number(req.query.tmdbId);
    const mediaType = req.query.mediaType as "movie" | "tv";

    if (isNaN(tmdbId) || !mediaType) {
      res.status(400).json({ error: "tmdbId and mediaType are required" });
      return;
    }

    const disliked = await check_if_disliked(req.userId, tmdbId, mediaType);
    res.json({ disliked });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default dislikesRouter;
