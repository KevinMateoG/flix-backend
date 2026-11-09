import { AppError } from "./errors/app.error.ts";
import { type AuthSession, type User } from "../domain/models/user.ts";
import { type Profile } from "../domain/models/profile.ts";
import { type ProfileRepository } from "../domain/repository/profile.repository.ts";
import { type UserRepository } from "../domain/repository/user.repository.ts";
import { requireNonEmptyString } from "./errors/validation.ts";

export interface AuthSessionPort {
  getSession(
    headers: Record<string, string | string[] | undefined>,
  ): Promise<AuthSession | null>;
}

export class AuthUseCase {
  private readonly sessionPort: AuthSessionPort;
  private readonly userRepository: UserRepository;
  private readonly profileRepository: ProfileRepository;

  constructor(
    sessionPort: AuthSessionPort,
    userRepository: UserRepository,
    profileRepository: ProfileRepository,
  ) {
    this.sessionPort = sessionPort;
    this.userRepository = userRepository;
    this.profileRepository = profileRepository;
  }

  async requireSession(
    headers: Record<string, string | string[] | undefined>,
  ): Promise<AuthSession> {
    const session = await this.sessionPort.getSession(headers);
    if (!session) {
      throw AppError.unauthorized("Unauthorized");
    }

    if (session.user.isActive === false) {
      throw AppError.forbidden("Account is deactivated");
    }

    const storedUser = await this.userRepository.findById(session.user.id);
    if (storedUser && storedUser.isActive === false) {
      throw AppError.forbidden("Account is deactivated");
    }

    if (storedUser) {
      session.user.role = storedUser.role;
      session.user.isActive = storedUser.isActive ?? true;
    }

    return session;
  }

  async getUserById(userId: string): Promise<User | null> {
    const validUserId = requireNonEmptyString(userId, "userId");

    return this.userRepository.findById(validUserId);
  }

  async initializeProfileForNewUser(
    userId: string,
    displayName: string,
    defaultRegion = "US",
  ): Promise<Profile> {
    const validUserId = requireNonEmptyString(userId, "userId");
    const validDisplayName = requireNonEmptyString(displayName, "displayName");
    const validDefaultRegion = requireNonEmptyString(
      defaultRegion,
      "defaultRegion",
    );

    return this.profileRepository.createDefault(
      validUserId,
      validDisplayName,
      validDefaultRegion,
    );
  }
}
