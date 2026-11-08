import { eq } from "drizzle-orm";
import { db } from "./client.ts";
import * as schema from "./schema.ts";
import {
  type Profile,
  type UpdateProfileSettingsInput,
} from "../../domain/models/profile.ts";
import { type ProfileRepository } from "../../domain/repository/profile.repository.ts";

export class DrizzleProfileRepository implements ProfileRepository {
  async findById(userId: string): Promise<Profile | null> {
    const result = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId))
      .limit(1);

    return result[0] ?? null;
  }

  async createDefault(
    userId: string,
    displayName: string,
    region = "US",
  ): Promise<Profile> {
    const result = await db
      .insert(schema.profiles)
      .values({
        id: userId,
        displayName,
        region,
      })
      .returning();

    return result[0];
  }

  async updateRegion(userId: string, region: string): Promise<Profile | null> {
    const result = await db
      .update(schema.profiles)
      .set({ region })
      .where(eq(schema.profiles.id, userId))
      .returning();

    return result[0] ?? null;
  }

  async updateSettings(
    userId: string,
    settings: UpdateProfileSettingsInput,
  ): Promise<Profile | null> {
    const fields: Partial<typeof schema.profiles.$inferInsert> = {};

    if (settings.language !== undefined) fields.language = settings.language;
    if (settings.maturityRating !== undefined) {
      fields.maturityRating = settings.maturityRating;
    }
    if (settings.isKids !== undefined) fields.isKids = settings.isKids;

    if (Object.keys(fields).length === 0) {
      return null;
    }

    const result = await db
      .update(schema.profiles)
      .set(fields)
      .where(eq(schema.profiles.id, userId))
      .returning();

    return result[0] ?? null;
  }
}
