import express, { type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
  toggle_my_list,
  get_my_list,
  remove_from_my_list,
  check_if_in_my_list,
} from "../controllers/my-list.controller.ts";

const myListRouter = express.Router();

myListRouter.use(authMiddleware);

myListRouter.get("/", async (req: Request, res: Response) => {
  try {
    const data = await get_my_list(req.userId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

myListRouter.post("/toggle", async (req: Request, res: Response) => {
  try {
    const { tmdbId, mediaType } = req.body;

    if (!tmdbId || !mediaType) {
      res.status(400).json({ error: "tmdbId and mediaType are required" });
      return;
    }

    const result = await toggle_my_list(req.userId, Number(tmdbId), mediaType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

myListRouter.delete("/:itemId", async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.itemId);

    if (isNaN(itemId)) {
      res.status(400).json({ error: "itemId must be a number" });
      return;
    }

    const deleted = await remove_from_my_list(itemId, req.userId);

    if (!deleted) {
      res.status(404).json({ error: "Item not found or not owned by user" });
      return;
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

myListRouter.get("/check", async (req: Request, res: Response) => {
  try {
    const tmdbId = Number(req.query.tmdbId);
    const mediaType = req.query.mediaType as "movie" | "tv";

    if (isNaN(tmdbId) || !mediaType) {
      res.status(400).json({ error: "tmdbId and mediaType are required" });
      return;
    }

    const inList = await check_if_in_my_list(req.userId, tmdbId, mediaType);
    res.json({ inList });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default myListRouter;
