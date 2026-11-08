import { and, eq } from "drizzle-orm";
import { db } from "./client.ts";
import * as schema from "./schema.ts";
import {
  type LibraryItem,
  type MediaType,
} from "../../domain/models/library-item.ts";
import { type LibraryRepository } from "../../domain/repository/library.repository.ts";

export class DrizzleLibraryRepository implements LibraryRepository {
  async getMyList(profileId: string): Promise<LibraryItem[]> {
    return db
      .select()
      .from(schema.myList)
      .where(eq(schema.myList.profileId, profileId))
      .orderBy(schema.myList.addedAt);
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
  ): Promise<void> {
    await db.insert(schema.myList).values({
      profileId,
      tmdbId,
      mediaType,
      addedAt,
    });
  }

  async removeMyListItemById(id: number): Promise<void> {
    await db.delete(schema.myList).where(eq(schema.myList.id, id));
  }

  async removeMyListItemForProfile(
    itemId: number,
    profileId: string,
  ): Promise<boolean> {
    const deleted = await db
      .delete(schema.myList)
      .where(
        and(
          eq(schema.myList.id, itemId),
          eq(schema.myList.profileId, profileId),
        ),
      )
      .returning({ id: schema.myList.id });

    return deleted.length > 0;
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
