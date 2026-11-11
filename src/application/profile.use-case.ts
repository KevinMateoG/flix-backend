import { randomUUID } from "node:crypto";
import { AppError } from "./errors/app.error.ts";
import { type AvatarStorage } from "../domain/storage/avatar-storage.ts";
import {
  type Profile,
  type UpdateProfileSettingsInput,
} from "../domain/models/profile.ts";
import { type ProfileRepository } from "../domain/repository/profile.repository.ts";
import { requireNonEmptyString } from "./errors/validation.ts";

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface AvatarUploadInput {
  buffer: Buffer;
  mimeType: string;
  size: number;
}

function matchesImageSignature(mimeType: string, buffer: Buffer): boolean {
  if (mimeType === "image/jpeg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8;
  }
  if (mimeType === "image/png") {
    return (
      buffer.length > 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  if (mimeType === "image/webp") {
    return (
      buffer.length > 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export class ProfileUseCase {
  private readonly profileRepository: ProfileRepository;
  private readonly avatarStorage: AvatarStorage;

  constructor(
    profileRepository: ProfileRepository,
    avatarStorage: AvatarStorage,
  ) {
    this.profileRepository = profileRepository;
    this.avatarStorage = avatarStorage;
  }

  /** Uploads a new avatar, or replaces the existing one. */
  async uploadAvatar(
    userId: string,
    file: AvatarUploadInput | undefined,
  ): Promise<Profile> {
    const validUserId = requireNonEmptyString(userId, "userId");
    if (!file) {
      throw AppError.badRequest("avatar file is required");
    }

    const extension = AVATAR_EXTENSIONS[file.mimeType];
    if (!extension) {
      throw AppError.badRequest("avatar must be a JPEG, PNG or WebP image");
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES || file.buffer.length > MAX_AVATAR_SIZE_BYTES) {
      throw new AppError("avatar must be 2MB or smaller", 413);
    }
    if (!matchesImageSignature(file.mimeType, file.buffer)) {
      throw AppError.badRequest("avatar content does not match its file type");
    }

    const current = await this.getProfile(validUserId);

    const stored = await this.avatarStorage.upload({
      key: `${validUserId}/${randomUUID()}.${extension}`,
      body: file.buffer,
      contentType: file.mimeType,
    });

    let updated: Profile | null;
    try {
      updated = await this.profileRepository.updateAvatar(validUserId, stored);
    } catch (error) {
      await this.avatarStorage.remove(stored.path).catch(() => undefined);
      throw error;
    }
    if (!updated) {
      await this.avatarStorage.remove(stored.path).catch(() => undefined);
      throw AppError.notFound("Profile not found");
    }

    if (current.avatarPath) {
      await this.avatarStorage.remove(current.avatarPath).catch(() => undefined);
    }

    return updated;
  }

  async deleteAvatar(userId: string): Promise<Profile> {
    const validUserId = requireNonEmptyString(userId, "userId");
    const current = await this.getProfile(validUserId);

    if (!current.avatarUrl && !current.avatarPath) {
      return current;
    }

    const updated = await this.profileRepository.updateAvatar(validUserId, null);
    if (!updated) {
      throw AppError.notFound("Profile not found");
    }

    if (current.avatarPath) {
      await this.avatarStorage.remove(current.avatarPath).catch(() => undefined);
    }

    return updated;
  }

  async getProfile(userId: string): Promise<Profile> {
    const validUserId = requireNonEmptyString(userId, "userId");

    const profile = await this.profileRepository.findById(validUserId);
    if (!profile) {
      throw AppError.notFound("Profile not found");
    }
    return profile;
  }

  async updateRegion(userId: string, region: unknown): Promise<Profile | null> {
    const validUserId = requireNonEmptyString(userId, "userId");
    const validRegion = requireNonEmptyString(region, "region");
    return this.profileRepository.updateRegion(validUserId, validRegion);
  }

  async updateSettings(
    userId: string,
    data: UpdateProfileSettingsInput,
  ): Promise<Profile> {
    const validUserId = requireNonEmptyString(userId, "userId");
    if (!data || typeof data !== "object") {
      throw AppError.badRequest("No valid fields to update");
    }
    const hasValidField =
      data.language !== undefined ||
      data.maturityRating !== undefined ||
      data.isKids !== undefined;

    if (
      !hasValidField ||
      (data.language !== undefined &&
        (typeof data.language !== "string" || data.language.trim().length === 0)) ||
      (data.maturityRating !== undefined &&
        (typeof data.maturityRating !== "string" ||
          data.maturityRating.trim().length === 0)) ||
      (data.isKids !== undefined && typeof data.isKids !== "boolean")
    ) {
      throw AppError.badRequest("No valid fields to update");
    }

    const updated = await this.profileRepository.updateSettings(validUserId, data);
    if (!updated) {
      throw AppError.badRequest("No valid fields to update");
    }

    return updated;
  }
}
