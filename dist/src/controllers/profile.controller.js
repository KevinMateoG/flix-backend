import { db } from "../db/db.js";
import * as schemas from "../db/schema.js";
import { eq } from "drizzle-orm";
export async function get_profile(userId) {
    const result = await db
        .select()
        .from(schemas.profiles)
        .where(eq(schemas.profiles.id, userId))
        .limit(1);
    return result[0] ?? null;
}
export async function update_profile_region(userId, region) {
    const result = await db
        .update(schemas.profiles)
        .set({ region })
        .where(eq(schemas.profiles.id, userId))
        .returning();
    return result[0] ?? null;
}
export async function update_profile_settings(userId, data) {
    const fields = {};
    if (data.language !== undefined)
        fields.language = data.language;
    if (data.maturityRating !== undefined)
        fields.maturityRating = data.maturityRating;
    if (data.isKids !== undefined)
        fields.isKids = data.isKids;
    if (Object.keys(fields).length === 0)
        return null;
    const result = await db
        .update(schemas.profiles)
        .set(fields)
        .where(eq(schemas.profiles.id, userId))
        .returning();
    return result[0] ?? null;
}
