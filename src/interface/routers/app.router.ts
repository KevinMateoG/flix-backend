import express, {
  type Express,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { type AuthUseCase } from "../../application/auth.use-case.ts";
import { type CatalogUseCase } from "../../application/catalog.use-case.ts";
import { type HistoryUseCase } from "../../application/history.use-case.ts";
import { type LibraryUseCase } from "../../application/library.use-case.ts";
import { type PlaybackUseCase } from "../../application/playback.use-case.ts";
import { type ProfileUseCase } from "../../application/profile.use-case.ts";
import { type TmdbUseCase } from "../../application/tmdb.use-case.ts";
import { CatalogController } from "../controllers/catalog.controller.ts";
import { HistoryController } from "../controllers/history.controller.ts";
import { LibraryController } from "../controllers/library.controller.ts";
import { PlaybackController } from "../controllers/playback.controller.ts";
import { ProfileController } from "../controllers/profile.controller.ts";
import { TmdbController } from "../controllers/tmdb.controller.ts";
import { createAuthMiddleware } from "../middlewares/auth.middleware.ts";
import { errorMiddleware } from "../middlewares/error.middleware.ts";
import { createDislikesRouter } from "./dislikes.router.ts";
import { createMoviesRouter } from "./movies.router.ts";
import { createMyListRouter } from "./my-list.router.ts";
import { createProfileRouter } from "./profile.router.ts";
import { openApiSpec } from "./swagger.ts";
import { createTmdbRouter } from "./tmdb.router.ts";
import { createWatchHistoryRouter } from "./watch-history.router.ts";

export interface AppDependencies {
  authHandler: RequestHandler;
  authUseCase: AuthUseCase;
  profileUseCase: ProfileUseCase;
  libraryUseCase: LibraryUseCase;
  historyUseCase: HistoryUseCase;
  catalogUseCase: CatalogUseCase;
  playbackUseCase: PlaybackUseCase;
  tmdbUseCase: TmdbUseCase;
}

export function createApp(deps: AppDependencies): Express {
  const app: Express = express();

  const authMiddleware = createAuthMiddleware(deps.authUseCase);
  const profileController = new ProfileController(deps.profileUseCase);
  const libraryController = new LibraryController(deps.libraryUseCase);
  const historyController = new HistoryController(deps.historyUseCase);
  const catalogController = new CatalogController(deps.catalogUseCase);
  const playbackController = new PlaybackController(deps.playbackUseCase);
  const tmdbController = new TmdbController(deps.tmdbUseCase);

  app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));

  app.use("/api/auth", deps.authHandler);

  app.use(express.json());

  app.get("/", (_req: Request, res: Response) => {
    res.send("Flix Backend OK");
  });

  app.get("/api-docs.json", (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use(
    "/api/movies",
    createMoviesRouter(catalogController, playbackController, authMiddleware),
  );
  app.use("/api/tmdb", createTmdbRouter(tmdbController));
  app.use(
    "/api/profile",
    createProfileRouter(profileController, authMiddleware),
  );
  app.use(
    "/api/watch-history",
    createWatchHistoryRouter(historyController, authMiddleware),
  );
  app.use(
    "/api/my-list",
    createMyListRouter(libraryController, authMiddleware),
  );
  app.use(
    "/api/dislikes",
    createDislikesRouter(libraryController, authMiddleware),
  );

  app.use(errorMiddleware);

  return app;
}
