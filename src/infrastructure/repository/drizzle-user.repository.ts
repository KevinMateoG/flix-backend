import { eq } from "drizzle-orm";
import { db } from "./client.ts";
import * as schema from "./schema.ts";
import { type User, type UserRole } from "../../domain/models/user.ts";
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, id))
      .limit(1);

    return result[0] ? toDomainUser(result[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);

    return result[0] ? toDomainUser(result[0]) : null;
  }
}