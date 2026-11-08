import { AppError } from "./errors/app.error.ts";
import {
  type Profile,
  type UpdateProfileSettingsInput,
} from "../domain/models/profile.ts";
import { type ProfileRepository } from "../domain/repository/profile.repository.ts";
import { requireNonEmptyString } from "./errors/validation.ts";

export class ProfileUseCase {
  private readonly profileRepository: ProfileRepository;

  constructor(profileRepository: ProfileRepository) {
    this.profileRepository = profileRepository;
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
