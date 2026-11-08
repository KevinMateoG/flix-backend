import { and, asc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "./client.ts";
import * as schema from "./schema.ts";
import {
  type CreatePlayableContentInput,
  type PlayableContent,
  type UpdatePlayableContentInput,
} from "../../domain/models/playable-content.ts";
import { type EntityStatusFilter } from "../../domain/models/user.ts";
import { type PlayableContentRepository } from "../../domain/repository/playable-content.repository.ts";

function normalizePlayableContent(row: PlayableContent): PlayableContent {
  return {
    ...row,
    muxAssetId:
      row.muxAssetId && row.muxAssetId.trim().toLowerCase() !== "null"
        ? row.muxAssetId
        : null,
  };
}

export class DrizzlePlayableContentRepository
  implements PlayableContentRepository
{
  async findAll(
    region?: string,
    status: EntityStatusFilter = "active",
  ): Promise<PlayableContent[]> {
    const conditions: SQL[] = [];

    if (status === "active") {
      conditions.push(eq(schema.playableContent.isActive, true));
    } else if (status === "inactive") {
      conditions.push(eq(schema.playableContent.isActive, false));
    }

    if (region) {
      conditions.push(
        sql`${schema.playableContent.availableRegions} @> ARRAY[${region}]::text[]`,
      );
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const rows = await db
      .select()
      .from(schema.playableContent)
      .where(whereClause)
      .orderBy(asc(schema.playableContent.tmdbId));

    return rows.map(normalizePlayableContent);
  }

  async findByTmdbId(
    tmdbId: number,
    includeInactive = false,
  ): Promise<PlayableContent | null> {
    const whereClause = includeInactive
      ? eq(schema.playableContent.tmdbId, tmdbId)
      : and(
          eq(schema.playableContent.tmdbId, tmdbId),
          eq(schema.playableContent.isActive, true),
        );

    const result = await db
      .select()
      .from(schema.playableContent)
      .where(whereClause)
      .limit(1);

    return result[0] ? normalizePlayableContent(result[0]) : null;
  }

  async isPlayableInRegion(tmdbId: number, region: string): Promise<boolean> {
    const result = await db
      .select({ tmdbId: schema.playableContent.tmdbId })
      .from(schema.playableContent)
      .where(
        and(
          eq(schema.playableContent.tmdbId, tmdbId),
          eq(schema.playableContent.isActive, true),
          sql`${schema.playableContent.availableRegions} @> ARRAY[${region}]::text[]`,
        ),
      )
      .limit(1);

    return result.length > 0;
  }

  async create(input: CreatePlayableContentInput): Promise<PlayableContent> {
    const rows = await db
      .insert(schema.playableContent)
      .values({
        tmdbId: input.tmdbId,
        muxPlaybackId: input.muxPlaybackId,
        muxAssetId: input.muxAssetId ?? null,
        availableRegions: input.availableRegions ?? ["US"],
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.playableContent.tmdbId,
        set: {
          muxPlaybackId: input.muxPlaybackId,
          muxAssetId: input.muxAssetId ?? null,
          availableRegions: input.availableRegions ?? ["US"],
          isActive: true,
        },
      })
      .returning();

    return rows[0];
  }

  async update(
    tmdbId: number,
    input: UpdatePlayableContentInput,
  ): Promise<PlayableContent | null> {
    const rows = await db
      .update(schema.playableContent)
      .set({
        ...(input.muxPlaybackId !== undefined
          ? { muxPlaybackId: input.muxPlaybackId }
          : {}),
        ...(input.muxAssetId !== undefined
          ? { muxAssetId: input.muxAssetId }
          : {}),
        ...(input.availableRegions !== undefined
          ? { availableRegions: input.availableRegions }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      })
      .where(eq(schema.playableContent.tmdbId, tmdbId))
      .returning();

    return rows[0] ?? null;
  }

  async softDelete(tmdbId: number): Promise<boolean> {
    const rows = await db
      .update(schema.playableContent)
      .set({ isActive: false })
      .where(
        and(
          eq(schema.playableContent.tmdbId, tmdbId),
          eq(schema.playableContent.isActive, true),
        ),
      )
      .returning({ tmdbId: schema.playableContent.tmdbId });

    return rows.length > 0;
  }
}
