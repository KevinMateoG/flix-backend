import { and, eq } from "drizzle-orm";
import { db } from "./client.ts";
import * as schema from "./schema.ts";
import {
  type LibraryItem,
  type MediaType,
  type UpdateLibraryItemInput,
} from "../../domain/models/library-item.ts";
import { type LibraryRepository } from "../../domain/repository/library.repository.ts";

export class DrizzleLibraryRepository implements LibraryRepository {
  async getMyList(profileId: string): Promise<LibraryItem[]> {
    return db
      .select()
      .from(schema.myList)
      .where(
        and(
          eq(schema.myList.profileId, profileId),
          eq(schema.myList.isActive, true),
        ),
      )
      .orderBy(schema.myList.addedAt);
  }

  async findMyListItemById(
    itemId: number,
    profileId: string,
  ): Promise<LibraryItem | null> {
    const result = await db
      .select()
      .from(schema.myList)
      .where(
        and(
          eq(schema.myList.id, itemId),
          eq(schema.myList.profileId, profileId),
          eq(schema.myList.isActive, true),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findMyListItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
  ): Promise<{ id: number } | null> {
    const result = await db
      .select({ id: schema.myList.id })
      .from(schema.myList)
      .where(
        and(
          eq(schema.myList.profileId, profileId),
          eq(schema.myList.tmdbId, tmdbId),
          eq(schema.myList.mediaType, mediaType),
          eq(schema.myList.isActive, true),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async addMyListItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
    addedAt: Date,
  ): Promise<LibraryItem> {
    const inserted = await db
      .insert(schema.myList)
      .values({
        profileId,
        tmdbId,
        mediaType,
        addedAt,
        isActive: true,
      })
      .returning();

    return inserted[0];
  }

  async updateMyListItem(
    itemId: number,
    profileId: string,
    input: UpdateLibraryItemInput,
  ): Promise<LibraryItem | null> {
    const updated = await db
      .update(schema.myList)
      .set({
        ...(input.tmdbId !== undefined ? { tmdbId: input.tmdbId } : {}),
        ...(input.mediaType !== undefined ? { mediaType: input.mediaType } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      })
      .where(
        and(
          eq(schema.myList.id, itemId),
          eq(schema.myList.profileId, profileId),
        ),
      )
      .returning();

    return updated[0] ?? null;
  }

  async removeMyListItemById(id: number): Promise<void> {
    await db
      .update(schema.myList)
      .set({ isActive: false })
      .where(eq(schema.myList.id, id));
  }

  async removeMyListItemForProfile(
    itemId: number,
    profileId: string,
  ): Promise<boolean> {
    const updated = await db
      .update(schema.myList)
      .set({ isActive: false })
      .where(
        and(
          eq(schema.myList.id, itemId),
          eq(schema.myList.profileId, profileId),
          eq(schema.myList.isActive, true),
        ),
      )
      .returning({ id: schema.myList.id });

    return updated.length > 0;
  }

  async findDislikeItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
  ): Promise<{ id: number } | null> {
    const result = await db
      .select({ id: schema.dislikes.id })
      .from(schema.dislikes)
      .where(
        and(
          eq(schema.dislikes.profileId, profileId),
          eq(schema.dislikes.tmdbId, tmdbId),
          eq(schema.dislikes.mediaType, mediaType),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async addDislikeItem(
    profileId: string,
    tmdbId: number,
    mediaType: MediaType,
    addedAt: Date,
  ): Promise<void> {
    await db.insert(schema.dislikes).values({
      profileId,
      tmdbId,
      mediaType,
      addedAt,
    });
  }

  async removeDislikeItemById(id: number): Promise<void> {
    await db.delete(schema.dislikes).where(eq(schema.dislikes.id, id));
  }
}