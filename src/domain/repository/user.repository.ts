import {
  type AdminUserRecord,
  type FindAdminUsersOptions,
  type UpdateAdminUserInput,
  type User,
} from "../models/user.ts";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAllWithProfiles?(options?: FindAdminUsersOptions): Promise<AdminUserRecord[]>;
  findByIdWithProfile?(id: string): Promise<AdminUserRecord | null>;
  updateUserAndProfile?(
    id: string,
    input: UpdateAdminUserInput,
  ): Promise<AdminUserRecord | null>;
  softDeleteUser?(id: string): Promise<boolean>;
}
