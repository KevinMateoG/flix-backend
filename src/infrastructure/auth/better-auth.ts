import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { db } from "../repository/client.ts";
import * as schema from "../repository/schema.ts";
import { DrizzleProfileRepository } from "../repository/drizzle-profile.repository.ts";
import { type AuthSessionPort } from "../../application/auth.use-case.ts";
import { type AuthSession } from "../../domain/models/user.ts";

const profileRepository = new DrizzleProfileRepository();

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
          await profileRepository.createDefault(user.id, user.name, "US");
        },
      },
    },
  },
});

export const authHandler = toNodeHandler(auth);

export class BetterAuthSessionAdapter implements AuthSessionPort {
  async getSession(
    headers: Record<string, string | string[] | undefined>,
  ): Promise<AuthSession | null> {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(headers),
    });

    if (!session) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: session.user.image ?? null,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
        token: session.session.token,
        createdAt: session.session.createdAt,
        updatedAt: session.session.updatedAt,
        ipAddress: session.session.ipAddress ?? null,
        userAgent: session.session.userAgent ?? null,
        userId: session.session.userId,
      },
    };
  }
}
