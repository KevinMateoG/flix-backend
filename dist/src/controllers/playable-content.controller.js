import { db } from "../db/db.js";
import * as schemas from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { getSignedPlaybackUrl } from "../lib/mux-client.js";
export async function is_title_playable(tmdbId, region) {
    const result = await db
        .select({ tmdbId: schemas.playableContent.tmdbId })
        .from(schemas.playableContent)
        .where(sql `${schemas.playableContent.tmdbId} = ${tmdbId}
        AND ${schemas.playableContent.availableRegions} @> ARRAY[${region}]::text[]`)
        .limit(1);
    return result.length > 0;
}
export async function get_playable_content(tmdbId) {
    const result = await db
        .select()
        .from(schemas.playableContent)
        .where(eq(schemas.playableContent.tmdbId, tmdbId))
        .limit(1);
    return result[0] ?? null;
}
export async function get_stream_url(tmdbId) {
    const content = await get_playable_content(tmdbId);
    if (!content?.muxPlaybackId)
        return null;
    const streamUrl = await getSignedPlaybackUrl(content.muxPlaybackId);
    return streamUrl;
}
