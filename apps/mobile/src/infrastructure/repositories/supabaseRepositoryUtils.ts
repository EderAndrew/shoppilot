import type { AuthRepository } from "@/application/ports/AuthRepository";
import { createAppError, toAppError } from "@/shared/errors/appError";

export async function requireCurrentUserId(authRepository: AuthRepository): Promise<string> {
  const userId = await authRepository.getCurrentUserId();

  if (!userId) {
    throw createAppError({
      category: "auth_required",
      message: "Sign in to continue.",
    });
  }

  return userId;
}

export function mapSupabaseError(error: unknown): never {
  throw toAppError(error, "unexpected");
}
