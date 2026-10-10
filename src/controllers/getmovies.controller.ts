import { db } from "../db/db.ts";
import * as schemas from "../db/schema.ts";
import { sql } from "drizzle-orm";

export default async function get_movies(region?: string) {
  const query = region
    ? db
        .select()
        .from(schemas.playableContent)
        .where(
          sql`${schemas.playableContent.availableRegions} @> ARRAY[${region}]::text[]`,
        )
    : db.select().from(schemas.playableContent);

  const movies = await query;
  return movies;
}
