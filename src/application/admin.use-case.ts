import {
  type AdminUserRecord,
  type EntityStatusFilter,
  type UpdateAdminUserInput,
  type UserRole,
} from "../domain/models/user.ts";
import { type UserRepository } from "../domain/repository/user.repository.ts";
import { AppError } from "./errors/app.error.ts";
import { requireNonEmptyString } from "./errors/validation.ts";
import {
  buildPaginatedResponse,
  parseStrictPositiveIntParam,
  type StandardPaginatedResponse,
} from "./pagination.ts";

export interface GetAdminUsersOptions {
  search?: string;
  role?: string;
  status?: string;
  page?: unknown;
  limit?: unknown;
}

function parseRoleFilter(role?: string): UserRole | undefined {
  if (role === undefined || role === "" || role === "all") return undefined;
  if (role === "admin" || role === "user") return role;
  throw AppError.badRequest("role must be one of: admin, user");
}

function parseStatusFilter(status?: string): EntityStatusFilter {
  if (status === undefined || status === "") return "all";
  if (status === "active" || status === "inactive" || status === "all") {
    return status;
  }
  throw AppError.badRequest("status must be one of: active, inactive, all");
}

export class AdminUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async getUsers(
    options: GetAdminUsersOptions = {},
  ): Promise<StandardPaginatedResponse<AdminUserRecord>> {
    if (!this.userRepository.findAllWithProfiles) {
      throw AppError.badRequest("Admin user listing is not supported");
    }

    const currentPage = parseStrictPositiveIntParam(options.page, "page", 1);
    const limit = parseStrictPositiveIntParam(options.limit, "limit", 10);
    const role = parseRoleFilter(options.role);
    const status = parseStatusFilter(options.status);

    const records = await this.userRepository.findAllWithProfiles({
      search: options.search,
      role,
      status,
    });

    return buildPaginatedResponse(records, currentPage, limit);
  }

  async getUserById(userId: string): Promise<AdminUserRecord> {
    const validId = requireNonEmptyString(userId, "userId");
    if (!this.userRepository.findByIdWithProfile) {
      throw AppError.badRequest("Admin user lookup is not supported");
    }

    const user = await this.userRepository.findByIdWithProfile(validId);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return user;
  }

  async updateUser(
    actorUserId: string,
    targetUserId: string,
    input: UpdateAdminUserInput,
  ): Promise<AdminUserRecord> {
    const validTargetId = requireNonEmptyString(targetUserId, "userId");
    if (!this.userRepository.updateUserAndProfile) {
      throw AppError.badRequest("Admin user update is not supported");
    }

    const updates: UpdateAdminUserInput = {};

    if (input.name !== undefined) {
      updates.name = requireNonEmptyString(input.name, "name");
    }

    if (input.email !== undefined) {
      const email = requireNonEmptyString(input.email, "email").toLowerCase();
      if (!email.includes("@")) {
        throw AppError.badRequest("email must be a valid email address");
      }
      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail && existingByEmail.id !== validTargetId) {
        throw AppError.badRequest("Email is already in use by another account");
      }
      updates.email = email;
    }

    if (input.role !== undefined) {
      if (input.role !== "admin" && input.role !== "user") {
        throw AppError.badRequest("role must be either 'admin' or 'user'");
      }
      if (actorUserId === validTargetId && input.role !== "admin") {
        throw AppError.badRequest("Cannot remove admin role from your own account");
      }
      updates.role = input.role;
    }

    if (input.isActive !== undefined) {
      if (typeof input.isActive !== "boolean") {
        throw AppError.badRequest("isActive must be a boolean");
      }
      if (actorUserId === validTargetId && input.isActive === false) {
        throw AppError.badRequest("Cannot deactivate your own account");
      }
      updates.isActive = input.isActive;
    }

    if (input.displayName !== undefined) {
      updates.displayName = requireNonEmptyString(
        input.displayName,
        "displayName",
      );
    }

    if (input.plan !== undefined) {
      if (input.plan !== null && typeof input.plan !== "string") {
        throw AppError.badRequest("plan must be a string or null");
      }
      updates.plan = input.plan ? input.plan.trim() : "free";
    }

    if (input.region !== undefined) {
      updates.region = requireNonEmptyString(input.region, "region").toUpperCase();
    }

    if (input.language !== undefined) {
      updates.language = requireNonEmptyString(input.language, "language");
    }

    if (input.maturityRating !== undefined) {
      updates.maturityRating = requireNonEmptyString(
        input.maturityRating,
        "maturityRating",
      );
    }

    if (input.isKids !== undefined) {
      if (typeof input.isKids !== "boolean") {
        throw AppError.badRequest("isKids must be a boolean");
      }
      updates.isKids = input.isKids;
    }

    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest("No valid fields to update");
    }

    const updated = await this.userRepository.updateUserAndProfile(
      validTargetId,
      updates,
    );
    if (!updated) {
      throw AppError.notFound("User not found");
    }

    return updated;
  }

  async deleteUser(
    actorUserId: string,
    targetUserId: string,
  ): Promise<{ success: boolean }> {
    const validTargetId = requireNonEmptyString(targetUserId, "userId");
    if (actorUserId === validTargetId) {
      throw AppError.badRequest("Cannot deactivate your own account");
    }

    if (!this.userRepository.softDeleteUser) {
      throw AppError.badRequest("Admin user deletion is not supported");
    }

    const deleted = await this.userRepository.softDeleteUser(validTargetId);
    if (!deleted) {
      throw AppError.notFound("User not found");
    }

    return { success: true };
  }
}
