import { db } from "../db/db.js";
import * as schemas from "../db/schema.js";
import { eq, and } from "drizzle-orm";
export async function toggle_my_list(profileId, tmdbId, mediaType) {
    const existing = await db
        .select({ id: schemas.myList.id })
        .from(schemas.myList)
        .where(and(eq(schemas.myList.profileId, profileId), eq(schemas.myList.tmdbId, tmdbId), eq(schemas.myList.mediaType, mediaType)))
        .limit(1);
    if (existing.length > 0) {
        await db.delete(schemas.myList).where(eq(schemas.myList.id, existing[0].id));
        return { added: false };
    }
    await db.insert(schemas.myList).values({
        profileId,
        tmdbId,
        mediaType,
        addedAt: new Date(),
    });
    return { added: true };
}
export async function get_my_list(profileId) {
    return db
        .select()
        .from(schemas.myList)
        .where(eq(schemas.myList.profileId, profileId))
        .orderBy(schemas.myList.addedAt);
}
export async function remove_from_my_list(itemId, profileId) {
    const deleted = await db
        .delete(schemas.myList)
        .where(and(eq(schemas.myList.id, itemId), eq(schemas.myList.profileId, profileId)))
        .returning({ id: schemas.myList.id });
    return deleted.length > 0;
}
export async function check_if_in_my_list(profileId, tmdbId, mediaType) {
    const result = await db
        .select({ id: schemas.myList.id })
        .from(schemas.myList)
        .where(and(eq(schemas.myList.profileId, profileId), eq(schemas.myList.tmdbId, tmdbId), eq(schemas.myList.mediaType, mediaType)))
        .limit(1);
    return result.length > 0;
}
