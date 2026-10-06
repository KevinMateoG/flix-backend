import { spawnSync } from "node:child_process";

console.log("Applying database migrations...");

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
process.exit(0);
