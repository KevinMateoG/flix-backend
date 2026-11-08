import {
  type Profile,
  type UpdateProfileSettingsInput,
} from "../../domain/models/profile.ts";

export interface UpdateRegionRequestDto {
  region?: unknown;
}

export interface UpdateProfileSettingsRequestDto {
  language?: string;
  maturityRating?: string;
  isKids?: boolean;
}

export type ProfileResponseDto = Omit<Profile, "avatarPath">;

export function toUpdateProfileSettingsInput(
  body: UpdateProfileSettingsRequestDto,
): UpdateProfileSettingsInput {
  return {
    language: body.language,
    maturityRating: body.maturityRating,
    isKids: body.isKids,
  };
}

export function toProfileResponseDto(profile: Profile): ProfileResponseDto {
  return {
    id: profile.id,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    plan: profile.plan,
    memberSince: profile.memberSince,
    region: profile.region,
    language: profile.language,
    maturityRating: profile.maturityRating,
    isKids: profile.isKids,
    regionSource: profile.regionSource,
  };
}
