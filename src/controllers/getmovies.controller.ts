import { db } from "../db/db.ts";
import * as schemas from "../db/schema.ts";
import { and, eq, sql } from "drizzle-orm";

export default async function get_movies(region?: string) {
  const whereClause = region
    ? and(
        eq(schemas.playableContent.isActive, true),
        sql`${schemas.playableContent.availableRegions} @> ARRAY[${region}]::text[]`,
      )
    : eq(schemas.playableContent.isActive, true);

  const movies = await db
    .select()
    .from(schemas.playableContent)
    .where(whereClause);

  return movies;
}
