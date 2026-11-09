import express, { type RequestHandler, type Router } from "express";
import { type AdminController } from "../controllers/admin.controller.ts";
import { type CatalogController } from "../controllers/catalog.controller.ts";
import { requireAdminMiddleware } from "../middlewares/auth.middleware.ts";

export function createAdminRouter(
  adminController: AdminController,
  catalogController: CatalogController,
  authMiddleware: RequestHandler,
): Router {
  const router = express.Router();

  router.use(authMiddleware, requireAdminMiddleware);

  router.get("/ping", adminController.ping);

  router.get("/users", adminController.getUsers);
  router.get("/users/:id", adminController.getUserById);
  router.patch("/users/:id", adminController.updateUser);
  router.put("/users/:id", adminController.updateUser);
  router.delete("/users/:id", adminController.deleteUser);

  router.get("/movies", catalogController.getAdminMovies);
  router.get("/movies/:tmdbId", catalogController.getMovieById);
  router.post("/movies", catalogController.createMovie);
  router.patch("/movies/:tmdbId", catalogController.updateMovie);
  router.put("/movies/:tmdbId", catalogController.updateMovie);
  router.delete("/movies/:tmdbId", catalogController.deleteMovie);

  return router;
}
