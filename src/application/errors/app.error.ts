export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(message, 401);
  }

  static notFound(message = "Not found"): AppError {
    return new AppError(message, 404);
  }

  static internal(message = "Internal Server Error"): AppError {
    return new AppError(message, 500);
  }
}
