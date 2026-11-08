import { AppError } from "./errors/app.error.ts";
import {
  type Profile,
  type UpdateProfileSettingsInput,
} from "../domain/models/profile.ts";
import { type ProfileRepository } from "../domain/repository/profile.repository.ts";

export class ProfileUseCase {
  private readonly profileRepository: ProfileRepository;

  constructor(profileRepository: ProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findById(userId);
    if (!profile) {
      throw AppError.notFound("Profile not found");
    }
    return profile;
  }

  async updateRegion(userId: string, region: unknown): Promise<Profile | null> {
    if (!region || typeof region !== "string") {
      throw AppError.badRequest("region is required and must be a string");
    }
    return this.profileRepository.updateRegion(userId, region);
  }

  async updateSettings(
    userId: string,
    data: UpdateProfileSettingsInput,
  ): Promise<Profile> {
    const hasValidField =
      data.language !== undefined ||
      data.maturityRating !== undefined ||
      data.isKids !== undefined;

    if (!hasValidField) {
      throw AppError.badRequest("No valid fields to update");
    }

    const updated = await this.profileRepository.updateSettings(userId, data);
    if (!updated) {
      throw AppError.badRequest("No valid fields to update");
    }

    return updated;
  }
}
