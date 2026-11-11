import { type AuthSession, type Session, type User, type UserRole} from "../../domain/models/user.ts";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDto {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
}

export interface AuthSessionDto {
  user: UserDto;
  session: SessionDto;
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toSessionDto(session: Session): SessionDto {
  return {
    id: session.id,
    expiresAt: session.expiresAt,
    token: session.token,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    userId: session.userId,
  };
}

export function toAuthSessionDto(authSession: AuthSession): AuthSessionDto {
  return {
    user: toUserDto(authSession.user),
    session: toSessionDto(authSession.session),
  };
}
