import { db } from "../db/db.ts";
import * as schemas from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { getSignedPlaybackUrl } from "../lib/mux-client.ts";

export async function is_title_playable(
  tmdbId: number,
  region: string,
): Promise<boolean> {
  const result = await db
    .select({ tmdbId: schemas.playableContent.tmdbId })
    .from(schemas.playableContent)
    .where(
      sql`${schemas.playableContent.tmdbId} = ${tmdbId}
        AND ${schemas.playableContent.availableRegions} @> ARRAY[${region}]::text[]`,
    )
    .limit(1);

  return result.length > 0;
}

export async function get_playable_content(tmdbId: number) {
  const result = await db
    .select()
    .from(schemas.playableContent)
    .where(eq(schemas.playableContent.tmdbId, tmdbId))
    .limit(1);

  return result[0] ?? null;
}

export async function get_stream_url(tmdbId: number): Promise<string | null> {
  const content = await get_playable_content(tmdbId);
  if (!content?.muxPlaybackId) return null;

  const streamUrl = await getSignedPlaybackUrl(content.muxPlaybackId);
  return streamUrl;
}
