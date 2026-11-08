import { eq, sql } from "drizzle-orm";
import { db } from "./client.ts";
import * as schema from "./schema.ts";
import { type PlayableContent } from "../../domain/models/playable-content.ts";
import { type PlayableContentRepository } from "../../domain/repository/playable-content.repository.ts";

export class DrizzlePlayableContentRepository
  implements PlayableContentRepository
{
  async findAll(region?: string): Promise<PlayableContent[]> {
    const query = region
      ? db
          .select()
          .from(schema.playableContent)
          .where(
            sql`${schema.playableContent.availableRegions} @> ARRAY[${region}]::text[]`,
          )
      : db.select().from(schema.playableContent);

    return query;
  }

  async findByTmdbId(tmdbId: number): Promise<PlayableContent | null> {
    const result = await db
      .select()
      .from(schema.playableContent)
      .where(eq(schema.playableContent.tmdbId, tmdbId))
      .limit(1);

    return result[0] ?? null;
  }

  async isPlayableInRegion(tmdbId: number, region: string): Promise<boolean> {
    const result = await db
      .select({ tmdbId: schema.playableContent.tmdbId })
      .from(schema.playableContent)
      .where(
        sql`${schema.playableContent.tmdbId} = ${tmdbId}
          AND ${schema.playableContent.availableRegions} @> ARRAY[${region}]::text[]`,
      )
      .limit(1);

    return result.length > 0;
  }
}
