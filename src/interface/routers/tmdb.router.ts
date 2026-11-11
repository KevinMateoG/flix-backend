import express, { type Router } from "express";
import { type TmdbController } from "../controllers/tmdb.controller.ts";

export function createTmdbRouter(tmdbController: TmdbController): Router {
  const router = express.Router();

  router.get("/search", tmdbController.search);
  router.get("/trending", tmdbController.trending);
  router.get("/popular", tmdbController.popular);
  router.get("/top-rated", tmdbController.topRated);
  router.get("/movie/:id", tmdbController.movieDetails);
  router.get("/tv/:id", tmdbController.tvDetails);
  router.get("/tv/:id/season/:season", tmdbController.seasonDetails);
  router.get("/details/:tmdbId", tmdbController.details);

  return router;
}
