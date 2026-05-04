export const APP_ERROR_CATEGORIES = [
  "validation_error",
  "auth_required",
  "forbidden",
  "not_found",
  "network_error",
  "conflict",
  "unexpected",
] as const;

export type AppErrorCategory = (typeof APP_ERROR_CATEGORIES)[number];

export type AppErrorInput = {
  category: AppErrorCategory;
  message: string;
  correlationId?: string;
  cause?: unknown;
};

export class AppError extends Error {
  readonly category: AppErrorCategory;
  readonly correlationId?: string;
  readonly cause?: unknown;

  constructor(input: AppErrorInput) {
    super(input.message);
    this.name = "AppError";
    this.category = input.category;
    this.correlationId = input.correlationId;
    this.cause = input.cause;
  }
}

const defaultMessages: Record<AppErrorCategory, string> = {
  auth_required: "Sign in to continue.",
  conflict: "This action conflicts with the current data.",
  forbidden: "You do not have permission to do that.",
  network_error: "Check your connection and try again.",
  not_found: "We could not find that record.",
  unexpected: "Something went wrong. Try again.",
  validation_error: "Check the form and try again.",
};

type ProviderError = {
  code?: string;
  message?: string;
  status?: number;
};

function isProviderError(error: unknown): error is ProviderError {
  return typeof error === "object" && error !== null;
}

function mapProviderCategory(error: ProviderError): AppErrorCategory {
  if (error.status === 401 || error.code === "PGRST301") return "auth_required";
  if (error.status === 403 || error.code === "42501") return "forbidden";
  if (error.status === 404 || error.code === "PGRST116") return "not_found";
  if (error.status === 409 || error.code === "23505") return "conflict";
  if (error.code === "23514" || error.code === "22001") return "validation_error";
  if (error.message?.toLowerCase().includes("network")) return "network_error";
  return "unexpected";
}

export function createAppError(input: AppErrorInput): AppError {
  return new AppError(input);
}

export function toAppError(
  error: unknown,
  fallbackCategory: AppErrorCategory = "unexpected",
): AppError {
  if (error instanceof AppError) return error;

  if (isProviderError(error)) {
    const category = mapProviderCategory(error);
    return new AppError({
      category,
      cause: error,
      message: defaultMessages[category],
    });
  }

  return new AppError({
    category: fallbackCategory,
    cause: error,
    message: defaultMessages[fallbackCategory],
  });
}

export function getSafeErrorMessage(error: unknown): string {
  return toAppError(error).message;
}
