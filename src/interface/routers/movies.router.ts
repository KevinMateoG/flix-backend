import express, { type RequestHandler, type Router } from "express";
import { type CatalogController } from "../controllers/catalog.controller.ts";
import { type PlaybackController } from "../controllers/playback.controller.ts";
import { requireAdminMiddleware } from "../middlewares/auth.middleware.ts";

export function createMoviesRouter(
  catalogController: CatalogController,
  playbackController: PlaybackController,
  authMiddleware: RequestHandler,
): Router {
  const router = express.Router();

  router.get("/", catalogController.getMovies);
  router.get("/:tmdbId/playable", catalogController.checkPlayable);
  router.get("/:tmdbId/stream", playbackController.getStream);
  router.get("/:tmdbId", catalogController.getMovieById);

  router.post(
    "/",
    authMiddleware,
    requireAdminMiddleware,
    catalogController.createMovie,
  );
  router.patch(
    "/:tmdbId",
    authMiddleware,
    requireAdminMiddleware,
    catalogController.updateMovie,
  );
  router.put(
    "/:tmdbId",
    authMiddleware,
    requireAdminMiddleware,
    catalogController.updateMovie,
  );
  router.delete(
    "/:tmdbId",
    authMiddleware,
    requireAdminMiddleware,
    catalogController.deleteMovie,
  );

  return router;
}