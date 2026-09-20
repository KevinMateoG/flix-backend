import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

export const pgsql = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle({ connection: process.env.DATABASE_URL });
