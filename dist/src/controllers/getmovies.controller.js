import { db } from "../db/db.js";
import * as schemas from "../db/schema.js";
import { sql } from "drizzle-orm";
export default async function get_movies(region) {
    const query = region
        ? db
            .select()
            .from(schemas.playableContent)
            .where(sql `${schemas.playableContent.availableRegions} @> ARRAY[${region}]::text[]`)
        : db.select().from(schemas.playableContent);
    const movies = await query;
    return movies;
}
