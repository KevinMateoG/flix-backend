import {
  type Profile,
  type UpdateProfileSettingsInput,
} from "../models/profile.ts";

export interface ProfileRepository {
  findById(userId: string): Promise<Profile | null>;
  createDefault(
    userId: string,
    displayName: string,
    region?: string,
  ): Promise<Profile>;
  updateRegion(userId: string, region: string): Promise<Profile | null>;
  updateAvatar(
    userId: string,
    avatar: { url: string; path: string } | null,
  ): Promise<Profile | null>;
  updateSettings(
    userId: string,
    settings: UpdateProfileSettingsInput,
  ): Promise<Profile | null>;
}
