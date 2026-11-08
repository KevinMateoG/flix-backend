import { type NextFunction, type Request, type Response } from "express";
import { type ProfileUseCase } from "../../application/profile.use-case.ts";
import {
  toProfileResponseDto,
  toUpdateProfileSettingsInput,
  type UpdateProfileSettingsRequestDto,
  type UpdateRegionRequestDto,
} from "../../infrastructure/dtos/profile.dto.ts";

export class ProfileController {
  private readonly profileUseCase: ProfileUseCase;

  constructor(profileUseCase: ProfileUseCase) {
    this.profileUseCase = profileUseCase;
  }

  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const profile = await this.profileUseCase.getProfile(req.userId);
      res.json(toProfileResponseDto(profile));
    } catch (error) {
      next(error);
    }
  };

  updateRegion = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { region } = (req.body ?? {}) as UpdateRegionRequestDto;
      const updated = await this.profileUseCase.updateRegion(
        req.userId,
        region,
      );
      res.json(updated ? toProfileResponseDto(updated) : null);
    } catch (error) {
      next(error);
    }
  };

  uploadAvatar = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const file = req.file
        ? {
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            size: req.file.size,
          }
        : undefined;
      const updated = await this.profileUseCase.uploadAvatar(req.userId, file);
      res.json(toProfileResponseDto(updated));
    } catch (error) {
      next(error);
    }
  };

  deleteAvatar = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const updated = await this.profileUseCase.deleteAvatar(req.userId);
      res.json(toProfileResponseDto(updated));
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = (req.body ?? {}) as UpdateProfileSettingsRequestDto;
      const updated = await this.profileUseCase.updateSettings(
        req.userId,
        toUpdateProfileSettingsInput(body),
      );
      res.json(toProfileResponseDto(updated));
    } catch (error) {
      next(error);
    }
  };
}
