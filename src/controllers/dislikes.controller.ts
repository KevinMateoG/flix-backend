import { db } from "../db/db.ts";
import * as schemas from "../db/schema.ts";
import { eq, and } from "drizzle-orm";

export async function toggle_dislike(
  profileId: string,
  tmdbId: number,
  mediaType: "movie" | "tv"
) {
  const existing = await db
    .select({ id: schemas.dislikes.id })
    .from(schemas.dislikes)
    .where(
      and(
        eq(schemas.dislikes.profileId, profileId),
        eq(schemas.dislikes.tmdbId, tmdbId),
        eq(schemas.dislikes.mediaType, mediaType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(schemas.dislikes).where(eq(schemas.dislikes.id, existing[0].id));
    return { added: false };
  }

  await db.insert(schemas.dislikes).values({
    profileId,
    tmdbId,
    mediaType,
    addedAt: new Date(),
  });

  return { added: true };
}

export async function check_if_disliked(
  profileId: string,
  tmdbId: number,
  mediaType: "movie" | "tv"
) {
  const result = await db
    .select({ id: schemas.dislikes.id })
    .from(schemas.dislikes)
    .where(
      and(
        eq(schemas.dislikes.profileId, profileId),
        eq(schemas.dislikes.tmdbId, tmdbId),
        eq(schemas.dislikes.mediaType, mediaType)
      )
    )
    .limit(1);

  return result.length > 0;
}
