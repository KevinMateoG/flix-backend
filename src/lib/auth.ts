import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./../db/db.ts";
import * as schema from "../db/schema.ts";

export const auth = betterAuth({
  trustedOrigins: [
    process.env.FRONTEND_URL ?? "http://localhost:5173",
    process.env.BACKEND_URL ?? "http://localhost:3000",
    "http://10.33.21.171:5173",
  ],
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
