import "dotenv/config";
import { AuthUseCase } from "./application/auth.use-case.ts";
import { CatalogUseCase } from "./application/catalog.use-case.ts";
import { HistoryUseCase } from "./application/history.use-case.ts";
import { LibraryUseCase } from "./application/library.use-case.ts";
import { PlaybackUseCase } from "./application/playback.use-case.ts";
import { ProfileUseCase } from "./application/profile.use-case.ts";
import { TmdbUseCase } from "./application/tmdb.use-case.ts";
import {
  authHandler,
  BetterAuthSessionAdapter,
} from "./infrastructure/auth/better-auth.ts";
import { DrizzleLibraryRepository } from "./infrastructure/repository/drizzle-library.repository.ts";
import { DrizzlePlayableContentRepository } from "./infrastructure/repository/drizzle-playable-content.repository.ts";
import { DrizzleProfileRepository } from "./infrastructure/repository/drizzle-profile.repository.ts";
import { DrizzleUserRepository } from "./infrastructure/repository/drizzle-user.repository.ts";
import { DrizzleWatchHistoryRepository } from "./infrastructure/repository/drizzle-watch-history.repository.ts";
import { muxService } from "./infrastructure/services/mux.service.ts";
import { avatarStorage } from "./infrastructure/services/s3-avatar-storage.service.ts";
import { tmdbService } from "./infrastructure/services/tmdb.service.ts";
import { createApp } from "./interface/routers/app.router.ts";

const userRepository = new DrizzleUserRepository();
const profileRepository = new DrizzleProfileRepository();
const playableContentRepository = new DrizzlePlayableContentRepository();
const libraryRepository = new DrizzleLibraryRepository();
const watchHistoryRepository = new DrizzleWatchHistoryRepository();
const sessionAdapter = new BetterAuthSessionAdapter();

export const app = createApp({
  authHandler,
  authUseCase: new AuthUseCase(
    sessionAdapter,
    userRepository,
    profileRepository,
  ),
  profileUseCase: new ProfileUseCase(profileRepository, avatarStorage),
  libraryUseCase: new LibraryUseCase(libraryRepository),
  historyUseCase: new HistoryUseCase(watchHistoryRepository),
  catalogUseCase: new CatalogUseCase(playableContentRepository),
  playbackUseCase: new PlaybackUseCase(playableContentRepository, muxService),
  tmdbUseCase: new TmdbUseCase(tmdbService),
});

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
