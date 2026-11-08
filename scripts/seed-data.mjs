import { readFile } from "node:fs/promises";
import pg from "pg";
import { hashPassword } from "better-auth/crypto";

const users = [
  {
    id: "67ed486a-bd4b-4445-850c-f1b12d4d84fb",
    name: "Flix Test One",
    email: "test1@flix.local",
  },
  {
    id: "1cc8b544-2456-4a21-a694-aad2859f013c",
    name: "Flix Test Two",
    email: "test2@flix.local",
  },
  {
    id: "4795a4cb-6d93-41e6-ad29-c45c54f236c8",
    name: "Flix Test Three",
    email: "test3@flix.local",
  },
  {
    id: "b850a939-aa35-4b00-8157-6b250905ff58",
    name: "Flix Test Four",
    email: "test4@flix.local",
  },
];

const password = "Flix1234!";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }

  values.push(value);
  return values;
}

function nullable(value) {
  return value === null || value === "" || value === "null" ? null : value;
}

async function readCsv(fileName) {
  const content = await readFile(new URL(`./${fileName}`, import.meta.url), "utf8");
  const [header, ...lines] = content.trim().split(/\r?\n/);
  const columns = parseCsvLine(header);

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = parseCsvLine(line);
      return Object.fromEntries(columns.map((column, index) => [column, values[index] || null]));
    });
}

async function seedUsers() {
  const passwordHash = await hashPassword(password);

  for (const user of users) {
    await client.query(
      `insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
       values ($1, $2, $3, true, now(), now())
       on conflict ("id") do nothing`,
      [user.id, user.name, user.email],
    );

    await client.query(
      `insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
       values ($1, $2, 'credential', $2, $3, now(), now())
       on conflict ("id") do nothing`,
      [`seed-account-${user.id}`, user.id, passwordHash],
    );

    await client.query(
      `insert into "profiles" ("id", "display_name", "region", "language", "maturity_rating", "is_kids", "member_since")
       values ($1, $2, 'US', 'en', 'TV-MA', false, now())
       on conflict ("id") do nothing`,
      [user.id, user.name],
    );
  }
}

async function seedPlayableContent() {
  const rows = await readCsv("playable-content.csv");

  for (const row of rows) {
    const regions = JSON.parse(row.available_regions.replaceAll('""', '"'));
    await client.query(
      `insert into "playable_content" ("tmdb_id", "mux_playback_id", "mux_asset_id", "available_regions")
       values ($1, $2, $3, $4)
       on conflict ("tmdb_id") do nothing`,
      [Number(row.tmdb_id), row.mux_playback_id, row.mux_asset_id, regions],
    );
  }
}

async function seedMyList() {
  const rows = await readCsv("my-list.csv");

  for (const row of rows) {
    await client.query(
      `insert into "my_list" ("id", "profile_id", "tmdb_id", "media_type", "added_at")
       values ($1, $2, $3, $4, $5)
       on conflict ("id") do nothing`,
      [Number(row.id), row.profile_id, Number(row.tmdb_id), row.media_type, row.added_at],
    );
  }
}

async function seedWatchHistory() {
  const rows = await readCsv("watch-history.csv");

  for (const row of rows) {
    await client.query(
      `insert into "watch_history"
       ("id", "user_id", "profile_id", "tmdb_id", "media_type", "title", "poster_path",
        "season_number", "episode_number", "episode_tmdb_id", "progress_seconds",
        "duration_seconds", "completed", "completed_at", "mux_playback_id", "device",
        "created_at", "updated_at")
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       on conflict ("id") do nothing`,
      [
        Number(row.id),
        row.user_id,
        row.profile_id,
        Number(row.tmdb_id),
        row.media_type,
        row.title,
        row.poster_path,
        Number(row.season_number),
        Number(row.episode_number),
        nullable(row.episode_tmdb_id) === null ? null : Number(row.episode_tmdb_id),
        Number(row.progress_seconds),
        Number(row.duration_seconds),
        row.completed === "true",
        nullable(row.completed_at),
        nullable(row.mux_playback_id),
        nullable(row.device),
        nullable(row.created_at),
        nullable(row.updated_at),
      ],
    );
  }
}

async function syncSequences() {
  for (const table of ["my_list", "watch_history"]) {
    const result = await client.query(
      `select
         pg_get_serial_sequence($1, 'id') as sequence_name,
         max("id") as max_id
       from "${table}"`,
      [`public.${table}`],
    );
    const { sequence_name: sequenceName, max_id: maxId } = result.rows[0];
    const nextValue = maxId === null ? 1 : Number(maxId) + 1;

    await client.query("select setval($1::regclass, $2, false)", [
      sequenceName,
      nextValue,
    ]);
  }
}

try {
  await client.connect();
  await seedUsers();
  await seedPlayableContent();
  await seedMyList();
  await seedWatchHistory();
  await syncSequences();
  console.log("Seed data loaded successfully.");
} finally {
  await client.end().catch(() => {});
}
