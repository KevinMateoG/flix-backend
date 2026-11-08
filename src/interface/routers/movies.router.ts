import express, { type Router } from "express";
import { type CatalogController } from "../controllers/catalog.controller.ts";
import { type PlaybackController } from "../controllers/playback.controller.ts";

export function createMoviesRouter(
  catalogController: CatalogController,
  playbackController: PlaybackController,
): Router {
  const router = express.Router();

  router.get("/", catalogController.getMovies);
  router.get("/:tmdbId/playable", catalogController.checkPlayable);
  router.get("/:tmdbId/stream", playbackController.getStream);

  return router;
}
