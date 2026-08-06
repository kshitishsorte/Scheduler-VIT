/**
 * An error that is safe to show the client, carrying the HTTP status it should
 * map to. Anything thrown that is *not* an ApiError is treated as a bug and
 * reported to the client as a generic 500, so internal details never leak.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  static badRequest(message = "Bad request", details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Not authenticated"): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = "Not allowed"): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = "Not found"): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = "Already exists"): ApiError {
    return new ApiError(409, message);
  }
}
