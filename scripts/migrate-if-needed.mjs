import { spawnSync } from "node:child_process";
import pg from "pg";

const tables = [
  "account",
  "dislikes",
  "my_list",
  "playable_content",
  "profiles",
  "session",
  "user",
  "verification",
  "watch_history",
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let existingTables = 0;

try {
  await client.connect();
  const result = await client.query(
    "select count(*)::int as count from pg_tables where schemaname = 'public' and tablename = any($1)",
    [tables],
  );
  existingTables = result.rows[0].count;

  if (existingTables === tables.length) {
    await client.query(
      `create unique index if not exists "watch_history_profile_content_episode_idx"
       on "watch_history" ("profile_id", "tmdb_id", "media_type", "season_number", "episode_number")`,
    );
    await client.query(
      `alter table "user" add column if not exists "role" text not null default 'user'`,
    );
    await client.query(
      `alter table "playable_content" add column if not exists "is_active" boolean not null default true`,
    );
    await client.query(
      `alter table "my_list" add column if not exists "is_active" boolean not null default true`,
    );
    await client.query(
      `alter table "watch_history" add column if not exists "is_active" boolean not null default true`,
    );
  }
} finally {
  await client.end().catch(() => {});
}

if (existingTables === tables.length) {
  console.log("Database tables already exist; skipping migrations.");
  process.exit(0);
}

console.log(
  `Database schema is incomplete (${existingTables}/${tables.length} tables); applying migrations.`,
);

const migration = spawnSync(
  "npx",
  ["drizzle-kit", "migrate", "--config=drizzle.config.ts"],
  { stdio: "inherit", shell: true },
);

if (migration.status !== 0) {
  console.error("Migration failed with status", migration.status);
  process.exit(migration.status ?? 1);
}

console.log("Migrations applied successfully.");
