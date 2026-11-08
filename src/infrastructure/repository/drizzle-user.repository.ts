import { asc, eq, sql } from "drizzle-orm";
import { db } from "./client.ts";
import * as schema from "./schema.ts";
import {
  type AdminUserRecord,
  type FindAdminUsersOptions,
  type UpdateAdminUserInput,
  type User,
  type UserRole,
} from "../../domain/models/user.ts";
import { type UserRepository } from "../../domain/repository/user.repository.ts";

function toUserRole(role: string | null | undefined): UserRole {
  return role === "admin" ? "admin" : "user";
}

function toDomainUser(row: typeof schema.user.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    image: row.image,
    role: toUserRole(row.role),
    isActive: row.isActive ?? true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toAdminUserRecord(
  userRow: typeof schema.user.$inferSelect,
  profileRow: typeof schema.profiles.$inferSelect | null,
): AdminUserRecord {
  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    emailVerified: userRow.emailVerified,
    image: userRow.image,
    role: toUserRole(userRow.role),
    isActive: userRow.isActive ?? true,
    createdAt: userRow.createdAt,
    updatedAt: userRow.updatedAt,
    displayName: profileRow?.displayName ?? userRow.name,
    avatarUrl: profileRow?.avatarUrl ?? userRow.image ?? null,
    plan: profileRow?.plan ?? "free",
    region: profileRow?.region ?? "US",
    language: profileRow?.language ?? "en-US",
    maturityRating: profileRow?.maturityRating ?? "TV-MA",
    isKids: Boolean(profileRow?.isKids),
    memberSince: profileRow?.memberSince ?? userRow.createdAt,
  };
}

let userIsActiveColumnEnsured = false;

async function ensureUserIsActiveColumn(): Promise<void> {
  if (userIsActiveColumnEnsured) return;
  try {
    await db.execute(
      sql`alter table "user" add column if not exists "is_active" boolean not null default true`,
    );
    userIsActiveColumnEnsured = true;
  } catch {
    // Column already exists or handled by migration
  }
}

export class DrizzleUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    await ensureUserIsActiveColumn();
    const result = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, id))
      .limit(1);

    return result[0] ? toDomainUser(result[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    await ensureUserIsActiveColumn();
    const result = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);

    return result[0] ? toDomainUser(result[0]) : null;
  }

  async findAllWithProfiles(
    options: FindAdminUsersOptions = {},
  ): Promise<AdminUserRecord[]> {
    await ensureUserIsActiveColumn();

    const rows = await db
      .select({
        user: schema.user,
        profile: schema.profiles,
      })
      .from(schema.user)
      .leftJoin(schema.profiles, eq(schema.user.id, schema.profiles.id))
      .orderBy(asc(schema.user.createdAt), asc(schema.user.email));

    let records = rows.map((r) => toAdminUserRecord(r.user, r.profile));

    const status = options.status ?? "all";
    if (status === "active") {
      records = records.filter((u) => u.isActive);
    } else if (status === "inactive") {
      records = records.filter((u) => !u.isActive);
    }

    if (options.role) {
      records = records.filter((u) => u.role === options.role);
    }

    if (options.search && options.search.trim().length > 0) {
      const term = options.search.trim().toLowerCase();
      records = records.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          (u.displayName?.toLowerCase().includes(term) ?? false) ||
          u.id.toLowerCase().includes(term),
      );
    }

    return records;
  }

  async findByIdWithProfile(id: string): Promise<AdminUserRecord | null> {
    await ensureUserIsActiveColumn();

    const rows = await db
      .select({
        user: schema.user,
        profile: schema.profiles,
      })
      .from(schema.user)
      .leftJoin(schema.profiles, eq(schema.user.id, schema.profiles.id))
      .where(eq(schema.user.id, id))
      .limit(1);

    if (!rows[0]) return null;
    return toAdminUserRecord(rows[0].user, rows[0].profile);
  }

  async updateUserAndProfile(
    id: string,
    input: UpdateAdminUserInput,
  ): Promise<AdminUserRecord | null> {
    await ensureUserIsActiveColumn();

    const existing = await this.findByIdWithProfile(id);
    if (!existing) return null;

    const userUpdates: Partial<typeof schema.user.$inferInsert> = {};
    if (input.name !== undefined) userUpdates.name = input.name;
    if (input.email !== undefined) userUpdates.email = input.email;
    if (input.role !== undefined) userUpdates.role = input.role;
    if (input.isActive !== undefined) userUpdates.isActive = input.isActive;

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updatedAt = new Date();
      await db
        .update(schema.user)
        .set(userUpdates)
        .where(eq(schema.user.id, id));
    }

    if (input.isActive === false) {
      await db.delete(schema.session).where(eq(schema.session.userId, id));
    }

    const profileUpdates: Partial<typeof schema.profiles.$inferInsert> = {};
    if (input.displayName !== undefined) {
      profileUpdates.displayName = input.displayName;
    } else if (input.name !== undefined) {
      profileUpdates.displayName = input.name;
    }
    if (input.plan !== undefined) profileUpdates.plan = input.plan;
    if (input.region !== undefined) profileUpdates.region = input.region;
    if (input.language !== undefined) profileUpdates.language = input.language;
    if (input.maturityRating !== undefined) {
      profileUpdates.maturityRating = input.maturityRating;
    }
    if (input.isKids !== undefined) profileUpdates.isKids = input.isKids;

    if (Object.keys(profileUpdates).length > 0) {
      const existingProfile = await db
        .select({ id: schema.profiles.id })
        .from(schema.profiles)
        .where(eq(schema.profiles.id, id))
        .limit(1);

      if (existingProfile.length > 0) {
        await db
          .update(schema.profiles)
          .set(profileUpdates)
          .where(eq(schema.profiles.id, id));
      } else {
        await db.insert(schema.profiles).values({
          id,
          displayName: profileUpdates.displayName ?? input.name ?? existing.name,
          plan: profileUpdates.plan ?? "free",
          region: profileUpdates.region ?? "US",
          language: profileUpdates.language ?? "en-US",
          maturityRating: profileUpdates.maturityRating ?? "TV-MA",
          isKids: profileUpdates.isKids ?? false,
          memberSince: new Date(),
        });
      }
    }

    return this.findByIdWithProfile(id);
  }

  async softDeleteUser(id: string): Promise<boolean> {
    await ensureUserIsActiveColumn();

    const rows = await db
      .update(schema.user)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.user.id, id))
      .returning({ id: schema.user.id });

    if (rows.length === 0) return false;

    await db.delete(schema.session).where(eq(schema.session.userId, id));
    return true;
  }
}
