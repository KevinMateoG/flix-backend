import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { type AddressInfo } from "node:net";
import { AuthUseCase, type AuthSessionPort } from "../src/application/auth.use-case.ts";
import { CatalogUseCase } from "../src/application/catalog.use-case.ts";
import { HistoryUseCase } from "../src/application/history.use-case.ts";
import { LibraryUseCase } from "../src/application/library.use-case.ts";
import { type StandardPaginatedResponse } from "../src/application/pagination.ts";
import { PlaybackUseCase, type PlaybackStreamPort } from "../src/application/playback.use-case.ts";
import { ProfileUseCase } from "../src/application/profile.use-case.ts";
import { TmdbUseCase, type TmdbGatewayPort } from "../src/application/tmdb.use-case.ts";
import {
  type LibraryItem,
  type MediaType,
  type UpdateLibraryItemInput,
} from "../src/domain/models/library-item.ts";
import {
  type CreatePlayableContentInput,
  type PlayableContent,
  type UpdatePlayableContentInput,
} from "../src/domain/models/playable-content.ts";
import { type Profile, type UpdateProfileSettingsInput } from "../src/domain/models/profile.ts";
import { type AuthSession, type User } from "../src/domain/models/user.ts";
import {
  type SeasonEpisodeProgress,
  type UpdateWatchHistoryInput,
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
      avatarPath: null,
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

  async updateAvatar(
    userId: string,
    avatar: { url: string; path: string } | null,
  ): Promise<Profile | null> {
    const existing = this.profiles.get(userId);
    if (!existing) return null;
    const updated: Profile = {
      ...existing,
      avatarUrl: avatar?.url ?? null,
      avatarPath: avatar?.path ?? null,
    };
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
    return this.myListItems.filter(
      (item) => item.profileId === profileId && item.isActive !== false,
    );
  }

  async findMyListItemById(
    itemId: number,
    profileId: string,
  ): Promise<LibraryItem | null> {
    return (
      this.myListItems.find(
        (i) =>
          i.id === itemId &&
          i.profileId === profileId &&
          i.isActive !== false,
      ) ?? null
    );
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
        i.mediaType === mediaType &&
        i.isActive !== false,
    );
    return found ? { id: found.id } : null;
  }

  async addMyListItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
    addedAt: Date,
  ): Promise<LibraryItem> {
    const item: LibraryItem = {
      id: this.nextId++,
      profileId,
      tmdbId,
      mediaType,
      addedAt,
      isActive: true,
    };
    this.myListItems.push(item);
    return item;
  }

  async updateMyListItem(
    itemId: number,
    profileId: string,
    input: UpdateLibraryItemInput,
  ): Promise<LibraryItem | null> {
    const idx = this.myListItems.findIndex(
      (i) => i.id === itemId && i.profileId === profileId,
    );
    if (idx < 0) return null;
    const updated: LibraryItem = {
      ...this.myListItems[idx],
      ...(input.tmdbId !== undefined ? { tmdbId: input.tmdbId } : {}),
      ...(input.mediaType !== undefined ? { mediaType: input.mediaType } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    };
    this.myListItems[idx] = updated;
    return updated;
  }

  async removeMyListItemById(id: number): Promise<void> {
    const found = this.myListItems.find((i) => i.id === id);
    if (found) {
      found.isActive = false;
    }
  }

  async removeMyListItemForProfile(
    itemId: number,
    profileId: string,
  ): Promise<boolean> {
    const found = this.myListItems.find(
      (i) =>
        i.id === itemId &&
        i.profileId === profileId &&
        i.isActive !== false,
    );
    if (!found) return false;
    found.isActive = false;
    return true;
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
      isActive: true,
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
      isActive: true,
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
          i.isActive !== false &&
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
          i.isActive !== false &&
          i.tmdbId === tmdbId &&
          i.seasonNumber === seasonNumber,
      )
      .map((i) => ({
        episodeNumber: i.episodeNumber,
        progressSeconds: i.progressSeconds,
        durationSeconds: i.durationSeconds,
      }));
  }

  async findByIdForProfile(
    id: number,
    profileId: string,
  ): Promise<WatchHistoryItem | null> {
    return (
      this.items.find(
        (i) =>
          i.id === id &&
          i.profileId === profileId &&
          i.isActive !== false,
      ) ?? null
    );
  }

  async updateByIdForProfile(
    id: number,
    profileId: string,
    input: UpdateWatchHistoryInput,
  ): Promise<WatchHistoryItem | null> {
    const idx = this.items.findIndex(
      (i) => i.id === id && i.profileId === profileId,
    );
    if (idx < 0) return null;
    const updated: WatchHistoryItem = {
      ...this.items[idx],
      ...(input.progressSeconds !== undefined
        ? { progressSeconds: input.progressSeconds }
        : {}),
      ...(input.durationSeconds !== undefined
        ? { durationSeconds: input.durationSeconds }
        : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.posterPath !== undefined
        ? { posterPath: input.posterPath }
        : {}),
      ...(input.completed !== undefined ? { completed: input.completed } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: new Date(),
    };
    this.items[idx] = updated;
    return updated;
  }

  async softDeleteForProfile(id: number, profileId: string): Promise<boolean> {
    const found = this.items.find(
      (i) =>
        i.id === id &&
        i.profileId === profileId &&
        i.isActive !== false,
    );
    if (!found) return false;
    found.isActive = false;
    return true;
  }
}

class InMemoryPlayableContentRepository implements PlayableContentRepository {
  private readonly items: PlayableContent[];

  constructor(items: PlayableContent[]) {
    this.items = items.map((item) => ({
      ...item,
      isActive: item.isActive ?? true,
    }));
  }

  async findAll(region?: string): Promise<PlayableContent[]> {
    const active = this.items.filter((i) => i.isActive !== false);
    if (!region) return active;
    return active.filter((i) => i.availableRegions?.includes(region));
  }

  async findByTmdbId(tmdbId: number): Promise<PlayableContent | null> {
    return (
      this.items.find((i) => i.tmdbId === tmdbId && i.isActive !== false) ??
      null
    );
  }

  async isPlayableInRegion(tmdbId: number, region: string): Promise<boolean> {
    const found = await this.findByTmdbId(tmdbId);
    return Boolean(found?.availableRegions?.includes(region));
  }

  async create(input: CreatePlayableContentInput): Promise<PlayableContent> {
    const existingIdx = this.items.findIndex((i) => i.tmdbId === input.tmdbId);
    const created: PlayableContent = {
      tmdbId: input.tmdbId,
      muxPlaybackId: input.muxPlaybackId,
      muxAssetId: input.muxAssetId ?? null,
      availableRegions: input.availableRegions ?? ["US"],
      isActive: true,
    };
    if (existingIdx >= 0) {
      this.items[existingIdx] = created;
    } else {
      this.items.push(created);
    }
    return created;
  }

  async update(
    tmdbId: number,
    input: UpdatePlayableContentInput,
  ): Promise<PlayableContent | null> {
    const idx = this.items.findIndex((i) => i.tmdbId === tmdbId);
    if (idx < 0) return null;
    const updated: PlayableContent = {
      ...this.items[idx],
      ...(input.muxPlaybackId !== undefined
        ? { muxPlaybackId: input.muxPlaybackId }
        : {}),
      ...(input.muxAssetId !== undefined ? { muxAssetId: input.muxAssetId } : {}),
      ...(input.availableRegions !== undefined
        ? { availableRegions: input.availableRegions }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    };
    this.items[idx] = updated;
    return updated;
  }

  async softDelete(tmdbId: number): Promise<boolean> {
    const found = this.items.find(
      (i) => i.tmdbId === tmdbId && i.isActive !== false,
    );
    if (!found) return false;
    found.isActive = false;
    return true;
  }
}

function createTestHarness() {
  const testUser: User = {
    id: "user_1",
    name: "Test User",
    email: "test2@flix.local",
    emailVerified: true,
    image: null,
    role: "user",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const adminUser: User = {
    id: "admin_1",
    name: "Admin User",
    email: "test1@flix.local",
    emailVerified: true,
    image: null,
    role: "admin",
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
      if (authHeader === "Bearer admin-token") {
        return {
          user: adminUser,
          session: {
            id: "sess_admin",
            userId: adminUser.id,
            token: "admin-token",
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

  const userRepository = new InMemoryUserRepository([testUser, adminUser]);
  const profileRepository = new InMemoryProfileRepository([
    {
      id: testUser.id,
      displayName: testUser.name,
      avatarUrl: null,
      avatarPath: null,
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
      isActive: true,
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
    profileUseCase: new ProfileUseCase(profileRepository, {
      upload: async (file) => ({ path: file.key, url: `https://cdn.test/${file.key}` }),
      remove: async () => undefined,
    }),
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
  test("Health, Auth (401/403), Profile, Library CRUD, History CRUD, Paginated Catalog CRUD, Playback, and TMDB contracts", async () => {
    const { app } = createTestHarness();
    const server = app.listen(0);
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const authHeaders = {
      Authorization: "Bearer valid-token",
      "Content-Type": "application/json",
    };
    const adminHeaders = {
      Authorization: "Bearer admin-token",
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

      // 4. Library (my-list & dislikes) CRUD + logical delete contracts
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

      const updateListItemRes = await fetch(
        `${baseUrl}/api/my-list/${listItems[0].id}`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ mediaType: "tv" }),
        },
      );
      assert.equal(updateListItemRes.status, 200);
      assert.equal(((await updateListItemRes.json()) as LibraryItem).mediaType, "tv");

      const deleteListRes = await fetch(
        `${baseUrl}/api/my-list/${listItems[0].id}`,
        { method: "DELETE", headers: authHeaders },
      );
      assert.equal(deleteListRes.status, 200);
      assert.deepEqual(await deleteListRes.json(), { success: true });

      const listAfterSoftDeleteRes = await fetch(`${baseUrl}/api/my-list`, {
        headers: authHeaders,
      });
      assert.equal(((await listAfterSoftDeleteRes.json()) as LibraryItem[]).length, 0);

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

      // 5. Watch History CRUD + 90% completion rule + logical delete
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

      const patchHistoryRes = await fetch(
        `${baseUrl}/api/watch-history/${continueItems[0].id}`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ title: "Interstellar (IMAX)" }),
        },
      );
      assert.equal(patchHistoryRes.status, 200);
      assert.equal(
        ((await patchHistoryRes.json()) as WatchHistoryItem).title,
        "Interstellar (IMAX)",
      );

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

      // Soft delete watch history item
      const deleteHistoryRes = await fetch(
        `${baseUrl}/api/watch-history/${continueItems[0].id}`,
        { method: "DELETE", headers: authHeaders },
      );
      assert.equal(deleteHistoryRes.status, 200);
      assert.deepEqual(await deleteHistoryRes.json(), { success: true });

      // 6. Catalog Pagination, Role Protection (403), CRUD & Playback contracts
      const moviesRes = await fetch(`${baseUrl}/api/movies?region=US&page=1&limit=10`);
      assert.equal(moviesRes.status, 200);
      const moviesPage =
        (await moviesRes.json()) as StandardPaginatedResponse<PlayableContent>;
      assert.equal(moviesPage.data.length, 1);
      assert.deepEqual(moviesPage.pagination, {
        total: 1,
        currentPage: 1,
        limit: 10,
        totalPages: 1,
      });

      const invalidPageRes = await fetch(`${baseUrl}/api/movies?page=0&limit=10`);
      assert.equal(invalidPageRes.status, 400);

      // Role guard: user gets 403 Forbidden on admin mutation
      const forbiddenMovieCreateRes = await fetch(`${baseUrl}/api/movies`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          tmdbId: 27205,
          muxPlaybackId: "mux_inception_id",
          availableRegions: ["US"],
        }),
      });
      assert.equal(forbiddenMovieCreateRes.status, 403);
      assert.deepEqual(await forbiddenMovieCreateRes.json(), {
        error: "Forbidden",
      });

      // Admin can create, update, and soft-delete playable content
      const adminCreateMovieRes = await fetch(`${baseUrl}/api/movies`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          tmdbId: 27205,
          muxPlaybackId: "mux_inception_id",
          availableRegions: ["US", "CO"],
        }),
      });
      assert.equal(adminCreateMovieRes.status, 201);

      const adminUpdateMovieRes = await fetch(`${baseUrl}/api/movies/27205`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ muxPlaybackId: "mux_inception_updated" }),
      });
      assert.equal(adminUpdateMovieRes.status, 200);
      assert.equal(
        ((await adminUpdateMovieRes.json()) as PlayableContent).muxPlaybackId,
        "mux_inception_updated",
      );

      const searchMoviesRes = await fetch(
        `${baseUrl}/api/movies?search=inception&page=1&limit=10`,
      );
      assert.equal(searchMoviesRes.status, 200);
      const searchPage =
        (await searchMoviesRes.json()) as StandardPaginatedResponse<PlayableContent>;
      assert.equal(searchPage.data.length, 1);
      assert.equal(searchPage.data[0].tmdbId, 27205);

      const adminDeleteMovieRes = await fetch(`${baseUrl}/api/movies/27205`, {
        method: "DELETE",
        headers: adminHeaders,
      });
      assert.equal(adminDeleteMovieRes.status, 200);
      assert.deepEqual(await adminDeleteMovieRes.json(), { success: true });

      const deletedMovieGetRes = await fetch(`${baseUrl}/api/movies/27205`);
      assert.equal(deletedMovieGetRes.status, 404);

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