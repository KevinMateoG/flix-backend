export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  plan: string | null;
  memberSince: Date | null;
  region: string | null;
  language: string | null;
  maturityRating: string | null;
  isKids: boolean | null;
  regionSource: string | null;
}

export interface UpdateProfileSettingsInput {
  language?: string;
  maturityRating?: string;
  isKids?: boolean;
}
