import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./../db/db.ts";
import * as schema from "../db/schema.ts";

const trustedOrigins = (
  process.env.BETTER_AUTH_TRUSTED_ORIGINS ??
  [process.env.FRONTEND_URL, process.env.BACKEND_URL]
    .filter(Boolean)
    .join(",")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(schema.profiles).values({
            id: user.id,
            displayName: user.name,
            region: "US", // Default region
          });
        },
      },
    },
  },
});
