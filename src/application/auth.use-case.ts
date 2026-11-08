import { AppError } from "./errors/app.error.ts";
import { type AuthSession, type User } from "../domain/models/user.ts";
import { type Profile } from "../domain/models/profile.ts";
import { type ProfileRepository } from "../domain/repository/profile.repository.ts";
import { type UserRepository } from "../domain/repository/user.repository.ts";

export interface AuthSessionPort {
  getSession(headers: Record<string, string | string[] | undefined>): Promise<AuthSession | null>;
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
    return session;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  async initializeProfileForNewUser(
    userId: string,
    displayName: string,
    defaultRegion = "US",
  ): Promise<Profile> {
    return this.profileRepository.createDefault(userId, displayName, defaultRegion);
  }
}
