export type UserRole = "admin" | "user";
export type EntityStatusFilter = "active" | "inactive" | "all";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  displayName: string | null;
  avatarUrl: string | null;
  plan: string | null;
  region: string | null;
  language: string | null;
  maturityRating: string | null;
  isKids: boolean;
  memberSince: Date | null;
}

export interface UpdateAdminUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  displayName?: string;
  plan?: string | null;
  region?: string;
  language?: string;
  maturityRating?: string;
  isKids?: boolean;
}

export interface FindAdminUsersOptions {
  search?: string;
  role?: UserRole;
  status?: EntityStatusFilter;
}

export interface Session {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
}

export interface AuthSession {
  user: User;
  session: Session;
}
