import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { type AddressInfo } from "node:net";
import { AuthUseCase, type AuthSessionPort } from "../src/application/auth.use-case.ts";
import { CatalogUseCase } from "../src/application/catalog.use-case.ts";
import { HistoryUseCase } from "../src/application/history.use-case.ts";
import { LibraryUseCase } from "../src/application/library.use-case.ts";
import { PlaybackUseCase, type PlaybackStreamPort } from "../src/application/playback.use-case.ts";
import { ProfileUseCase } from "../src/application/profile.use-case.ts";
import { TmdbUseCase, type TmdbGatewayPort } from "../src/application/tmdb.use-case.ts";
import { type LibraryItem, type MediaType } from "../src/domain/models/library-item.ts";
import { type PlayableContent } from "../src/domain/models/playable-content.ts";
import { type Profile, type UpdateProfileSettingsInput } from "../src/domain/models/profile.ts";
import { type AuthSession, type User } from "../src/domain/models/user.ts";
import {
  type SeasonEpisodeProgress,
  type UpsertWatchHistoryRecord,
  type WatchHistoryItem,
} from "../src/domain/models/watch-history.ts";
import { type LibraryRepository } from "../src/domain/repository/library.repository.ts";
import { type PlayableContentRepository } from "../src/domain/repository/playable-content.repository.ts";
import { type ProfileRepository } from "../src/domain/repository/profile.repository.ts";
import { type UserRepository } from "../src/domain/repository/user.repository.ts";
import { type WatchHistoryRepository } from "../src/domain/repository/watch-history.repository.ts";
import { createApp } from "../src/interface/routers/app.router.ts";

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  constructor(initial: User[] = []) {
    for (const u of initial) {
      this.users.set(u.id, u);
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }
}

class InMemoryProfileRepository implements ProfileRepository {
  private readonly profiles = new Map<string, Profile>();

  constructor(initial: Profile[] = []) {
    for (const p of initial) {
      this.profiles.set(p.id, p);
    }
  }

  async findById(userId: string): Promise<Profile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async createDefault(userId: string, displayName: string, region = "US"): Promise<Profile> {
    const profile: Profile = {
      id: userId,
      displayName,
      avatarUrl: null,
      plan: "standard",
      memberSince: new Date("2026-01-01T00:00:00.000Z"),
      region,
      language: "en-US",
      maturityRating: "TV-MA",
      isKids: false,
      regionSource: null,
    };
    this.profiles.set(userId, profile);
    return profile;
  }

  async updateRegion(userId: string, region: string): Promise<Profile | null> {
    const existing = this.profiles.get(userId);
    if (!existing) return null;
    const updated = { ...existing, region };
    this.profiles.set(userId, updated);
    return updated;
  }

  async updateSettings(
    userId: string,
    settings: UpdateProfileSettingsInput,
  ): Promise<Profile | null> {
    const existing = this.profiles.get(userId);
    if (!existing) return null;
    const updated: Profile = {
      ...existing,
      ...(settings.language !== undefined ? { language: settings.language } : {}),
      ...(settings.maturityRating !== undefined
        ? { maturityRating: settings.maturityRating }
        : {}),
      ...(settings.isKids !== undefined ? { isKids: settings.isKids } : {}),
    };
    this.profiles.set(userId, updated);
    return updated;
  }
}

class InMemoryLibraryRepository implements LibraryRepository {
  private myListItems: LibraryItem[] = [];
  private dislikeItems: LibraryItem[] = [];
  private nextId = 1;

  async getMyList(profileId: string): Promise<LibraryItem[]> {
    return this.myListItems.filter((item) => item.profileId === profileId);
  }

  async findMyListItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
  ): Promise<{ id: number } | null> {
    const found = this.myListItems.find(
      (i) =>
        i.profileId === profileId &&
        i.tmdbId === tmdbId &&
        i.mediaType === mediaType,
    );
    return found ? { id: found.id } : null;
  }

  async addMyListItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
    addedAt: Date,
  ): Promise<void> {
    this.myListItems.push({
      id: this.nextId++,
      profileId,
      tmdbId,
      mediaType,
      addedAt,
    });
  }

  async removeMyListItemById(id: number): Promise<void> {
    this.myListItems = this.myListItems.filter((i) => i.id !== id);
  }

  async removeMyListItemForProfile(itemId: number, profileId: string): Promise<boolean> {
    const before = this.myListItems.length;
    this.myListItems = this.myListItems.filter(
      (i) => !(i.id === itemId && i.profileId === profileId),
    );
    return this.myListItems.length < before;
  }

  async findDislikeItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
  ): Promise<{ id: number } | null> {
    const found = this.dislikeItems.find(
      (i) =>
        i.profileId === profileId &&
        i.tmdbId === tmdbId &&
        i.mediaType === mediaType,
    );
    return found ? { id: found.id } : null;
  }

  async addDislikeItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
    addedAt: Date,
  ): Promise<void> {
    this.dislikeItems.push({
      id: this.nextId++,
      profileId,
      tmdbId,
      mediaType,
      addedAt,
    });
  }

  async removeDislikeItemById(id: number): Promise<void> {
    this.dislikeItems = this.dislikeItems.filter((i) => i.id !== id);
  }
}

class InMemoryWatchHistoryRepository implements WatchHistoryRepository {
  private items: WatchHistoryItem[] = [];
  private nextId = 1;

  async upsertProgress(record: UpsertWatchHistoryRecord): Promise<void> {
    const idx = this.items.findIndex(
      (i) =>
        i.profileId === record.profileId &&
        i.tmdbId === record.tmdbId &&
        i.mediaType === record.mediaType &&
        i.seasonNumber === record.seasonNumber &&
        i.episodeNumber === record.episodeNumber,
    );

    const entry: WatchHistoryItem = {
      id: idx >= 0 ? this.items[idx].id : this.nextId++,
      userId: record.userId,
      profileId: record.profileId,
      tmdbId: record.tmdbId,
      mediaType: record.mediaType,
      title: record.title ?? null,
      posterPath: record.posterPath ?? null,
      seasonNumber: record.seasonNumber,
      episodeNumber: record.episodeNumber,
      episodeTmdbId: null,
      progressSeconds: record.progressSeconds,
      durationSeconds: record.durationSeconds,
      completed: record.completed,
      completedAt: record.completedAt,
      muxPlaybackId: record.muxPlaybackId ?? null,
      device: null,
      createdAt: record.updatedAt,
      updatedAt: record.updatedAt,
    };

    if (idx >= 0) {
      this.items[idx] = entry;
    } else {
      this.items.push(entry);
    }
  }

  async getContinueWatching(
    profileId: string,
    limit: number,
  ): Promise<WatchHistoryItem[]> {
    return this.items
      .filter(
        (i) =>
          i.profileId === profileId &&
          i.completed === false &&
          (i.progressSeconds ?? 0) > 0,
      )
      .slice(0, limit);
  }

  async getSeasonProgress(
    profileId: string,
    tmdbId: number,
    seasonNumber: number,
  ): Promise<SeasonEpisodeProgress[]> {
    return this.items
      .filter(
        (i) =>
          i.profileId === profileId &&
          i.tmdbId === tmdbId &&
          i.seasonNumber === seasonNumber,
      )
      .map((i) => ({
        episodeNumber: i.episodeNumber,
        progressSeconds: i.progressSeconds,
        durationSeconds: i.durationSeconds,
      }));
  }
}

class InMemoryPlayableContentRepository implements PlayableContentRepository {
  private readonly items: PlayableContent[];

  constructor(items: PlayableContent[]) {
    this.items = items;
  }

  async findAll(region?: string): Promise<PlayableContent[]> {
    if (!region) return this.items;
    return this.items.filter((i) => i.availableRegions?.includes(region));
  }

  async findByTmdbId(tmdbId: number): Promise<PlayableContent | null> {
    return this.items.find((i) => i.tmdbId === tmdbId) ?? null;
  }

  async isPlayableInRegion(tmdbId: number, region: string): Promise<boolean> {
    const found = await this.findByTmdbId(tmdbId);
    return Boolean(found?.availableRegions?.includes(region));
  }
}

function createTestHarness() {
  const testUser: User = {
    id: "user_1",
    name: "Test User",
    email: "test1@flix.local",
    emailVerified: true,
    image: null,
    role: "user",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const sessionPort: AuthSessionPort = {
    async getSession(headers): Promise<AuthSession | null> {
      const authHeader = headers.authorization;
      if (authHeader === "Bearer valid-token") {
        return {
          user: testUser,
          session: {
            id: "sess_1",
            userId: testUser.id,
            token: "valid-token",
            expiresAt: new Date("2027-01-01T00:00:00.000Z"),
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            ipAddress: "127.0.0.1",
            userAgent: "node-test",
          },
        };
      }
      return null;
    },
  };

  const userRepository = new InMemoryUserRepository([testUser]);
  const profileRepository = new InMemoryProfileRepository([
    {
      id: testUser.id,
      displayName: testUser.name,
      avatarUrl: null,
      plan: "standard",
      memberSince: new Date("2026-01-01T00:00:00.000Z"),
      region: "US",
      language: "en-US",
      maturityRating: "TV-MA",
      isKids: false,
      regionSource: null,
    },
  ]);
  const libraryRepository = new InMemoryLibraryRepository();
  const watchHistoryRepository = new InMemoryWatchHistoryRepository();
  const playableContentRepository = new InMemoryPlayableContentRepository([
    {
      tmdbId: 157336,
      muxPlaybackId: "mux_interstellar_id",
      muxAssetId: "asset_1",
      availableRegions: ["US", "MX"],
    },
  ]);

  const playbackStreamPort: PlaybackStreamPort = {
    async getSignedPlaybackUrl(playbackId: string): Promise<string> {
      return `https://stream.mux.com/${playbackId}.m3u8`;
    },
  };

  const tmdbGateway: TmdbGatewayPort = {
    async trending() {
      return { page: 1, results: [{ id: 157336, title: "Interstellar" }] };
    },
    async popular() {
      return { page: 1, results: [{ id: 157336, title: "Interstellar" }] };
    },
    async topRated() {
      return { page: 1, results: [{ id: 157336, title: "Interstellar" }] };
    },
    async search(query: string) {
      return { page: 1, results: [{ id: 157336, title: query }] };
    },
    async movieDetails(id: number) {
      if (id === 157336) return { id: 157336, title: "Interstellar" };
      throw new Error("TMDB 404");
    },
    async tvDetails(id: number) {
      if (id === 1399) return { id: 1399, name: "Game of Thrones" };
      throw new Error("TMDB 404");
    },
    async seasonDetails(tvId: number, seasonNumber: number) {
      return { id: tvId, season_number: seasonNumber, episodes: [] };
    },
  };

  const app = createApp({
    authHandler: (_req, res) => {
      res.json({ ok: true });
    },
    authUseCase: new AuthUseCase(sessionPort, userRepository, profileRepository),
    profileUseCase: new ProfileUseCase(profileRepository),
    libraryUseCase: new LibraryUseCase(libraryRepository),
    historyUseCase: new HistoryUseCase(watchHistoryRepository),
    catalogUseCase: new CatalogUseCase(playableContentRepository),
    playbackUseCase: new PlaybackUseCase(
      playableContentRepository,
      playbackStreamPort,
    ),
    tmdbUseCase: new TmdbUseCase(tmdbGateway),
  });

  return { app, watchHistoryRepository };
}

describe("Flix Backend Clean Architecture Contracts & Smoke Tests", () => {
  test("Health, Auth, Profile, Library, History, Catalog, Playback, and TMDB contracts", async () => {
    const { app } = createTestHarness();
    const server = app.listen(0);
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const authHeaders = {
      Authorization: "Bearer valid-token",
      "Content-Type": "application/json",
    };

    try {
      // 1. Health check
      const healthRes = await fetch(`${baseUrl}/`);
      assert.equal(healthRes.status, 200);
      assert.equal(await healthRes.text(), "Flix Backend OK");

      // 2. Unauthorized guard on protected routes
      const unauthRes = await fetch(`${baseUrl}/api/profile/me`);
      assert.equal(unauthRes.status, 401);
      assert.deepEqual(await unauthRes.json(), { error: "Unauthorized" });

      // 3. Profile contracts
      const profileMeRes = await fetch(`${baseUrl}/api/profile/me`, {
        headers: authHeaders,
      });
      assert.equal(profileMeRes.status, 200);
      const profileData = (await profileMeRes.json()) as Profile;
      assert.equal(profileData.id, "user_1");
      assert.equal(profileData.region, "US");

      const updateRegionRes = await fetch(`${baseUrl}/api/profile/region`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ region: "MX" }),
      });
      assert.equal(updateRegionRes.status, 200);
      assert.equal(((await updateRegionRes.json()) as Profile).region, "MX");

      const invalidSettingsRes = await fetch(`${baseUrl}/api/profile/settings`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      assert.equal(invalidSettingsRes.status, 400);
      assert.deepEqual(await invalidSettingsRes.json(), {
        error: "No valid fields to update",
      });

      const validSettingsRes = await fetch(`${baseUrl}/api/profile/settings`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ language: "es-ES", isKids: true }),
      });
      assert.equal(validSettingsRes.status, 200);
      const updatedProfile = (await validSettingsRes.json()) as Profile;
      assert.equal(updatedProfile.language, "es-ES");
      assert.equal(updatedProfile.isKids, true);

      // 4. Library (my-list & dislikes) contracts
      const toggleAddRes = await fetch(`${baseUrl}/api/my-list/toggle`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ tmdbId: 157336, mediaType: "movie" }),
      });
      assert.equal(toggleAddRes.status, 200);
      assert.deepEqual(await toggleAddRes.json(), { added: true });

      const checkListRes = await fetch(
        `${baseUrl}/api/my-list/check?tmdbId=157336&mediaType=movie`,
        { headers: authHeaders },
      );
      assert.equal(checkListRes.status, 200);
      assert.deepEqual(await checkListRes.json(), { inList: true });

      const listRes = await fetch(`${baseUrl}/api/my-list`, {
        headers: authHeaders,
      });
      const listItems = (await listRes.json()) as LibraryItem[];
      assert.equal(listItems.length, 1);

      const deleteListRes = await fetch(
        `${baseUrl}/api/my-list/${listItems[0].id}`,
        { method: "DELETE", headers: authHeaders },
      );
      assert.equal(deleteListRes.status, 200);
      assert.deepEqual(await deleteListRes.json(), { success: true });

      const dislikeToggleRes = await fetch(`${baseUrl}/api/dislikes/toggle`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ tmdbId: 157336, mediaType: "movie" }),
      });
      assert.equal(dislikeToggleRes.status, 200);
      assert.deepEqual(await dislikeToggleRes.json(), { added: true });

      const dislikeCheckRes = await fetch(
        `${baseUrl}/api/dislikes/check?tmdbId=157336&mediaType=movie`,
        { headers: authHeaders },
      );
      assert.equal(dislikeCheckRes.status, 200);
      assert.deepEqual(await dislikeCheckRes.json(), { disliked: true });

      // 5. Watch History contracts + 90% completion rule
      const progressRes = await fetch(
        `${baseUrl}/api/watch-history/update-progress`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            tmdbId: 157336,
            mediaType: "movie",
            progressSeconds: 500,
            durationSeconds: 1000,
            title: "Interstellar",
          }),
        },
      );
      assert.equal(progressRes.status, 200);
      assert.deepEqual(await progressRes.json(), { success: true });

      const continueWatchingRes = await fetch(`${baseUrl}/api/watch-history`, {
        headers: authHeaders,
      });
      const continueItems = (await continueWatchingRes.json()) as WatchHistoryItem[];
      assert.equal(continueItems.length, 1);
      assert.equal(continueItems[0].completed, false);

      // Update to >= 90% (900 / 1000) -> completed: true -> excluded from continue watching
      await fetch(`${baseUrl}/api/watch-history/update-progress`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          tmdbId: 157336,
          mediaType: "movie",
          progressSeconds: 900,
          durationSeconds: 1000,
          title: "Interstellar",
        }),
      });
      const afterCompleteRes = await fetch(`${baseUrl}/api/watch-history`, {
        headers: authHeaders,
      });
      assert.equal(((await afterCompleteRes.json()) as WatchHistoryItem[]).length, 0);

      // 6. Catalog & Playback contracts
      const moviesRes = await fetch(`${baseUrl}/api/movies?region=US`);
      assert.equal(moviesRes.status, 200);
      assert.equal(((await moviesRes.json()) as PlayableContent[]).length, 1);

      const playableRes = await fetch(
        `${baseUrl}/api/movies/157336/playable?region=BR`,
      );
      assert.equal(playableRes.status, 200);
      assert.deepEqual(await playableRes.json(), { playable: false });

      const streamRes = await fetch(`${baseUrl}/api/movies/157336/stream`);
      assert.equal(streamRes.status, 200);
      const streamData = (await streamRes.json()) as { streamUrl: string };
      assert.equal(
        streamData.streamUrl,
        "https://stream.mux.com/mux_interstellar_id.m3u8",
      );

      const missingStreamRes = await fetch(`${baseUrl}/api/movies/999999/stream`);
      assert.equal(missingStreamRes.status, 404);

      // 7. TMDB contracts
      const shortSearchRes = await fetch(`${baseUrl}/api/tmdb/search?q=a`);
      assert.equal(shortSearchRes.status, 200);
      assert.deepEqual(await shortSearchRes.json(), { results: [] });

      const validSearchRes = await fetch(
        `${baseUrl}/api/tmdb/search?q=Interstellar`,
      );
      assert.equal(validSearchRes.status, 200);

      const detailsMovieRes = await fetch(`${baseUrl}/api/tmdb/details/157336`);
      assert.equal(detailsMovieRes.status, 200);
      assert.equal(
        ((await detailsMovieRes.json()) as { media_type: string }).media_type,
        "movie",
      );

      const detailsTvRes = await fetch(`${baseUrl}/api/tmdb/details/1399`);
      assert.equal(detailsTvRes.status, 200);
      assert.equal(
        ((await detailsTvRes.json()) as { media_type: string }).media_type,
        "tv",
      );

      const detailsNotFoundRes = await fetch(`${baseUrl}/api/tmdb/details/40404`);
      assert.equal(detailsNotFoundRes.status, 404);
    } finally {
      server.close();
    }
  });
});
