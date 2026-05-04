import { describe, expect, it, vi } from "vitest";

import type { AuthRepository } from "../../../src/application/ports/AuthRepository";
import { LoginUser, LogoutUser, RegisterUser, RestoreSession } from "../../../src/application/use-cases/auth";

const session = { user: { email: "user@example.com", id: "user-1" } };

function authRepository(): AuthRepository {
  return {
    getCurrentUserId: vi.fn(async () => "user-1"),
    login: vi.fn(async () => session),
    logout: vi.fn(async () => undefined),
    register: vi.fn(async () => session),
    restoreSession: vi.fn(async () => session),
  };
}

describe("auth use cases", () => {
  it("registers a user", async () => {
    const repository = authRepository();

    await expect(
      new RegisterUser(repository).execute({
        email: "user@example.com",
        password: "password123",
      }),
    ).resolves.toEqual(session);
  });

  it("logs in, logs out, and restores a session", async () => {
    const repository = authRepository();

    await expect(
      new LoginUser(repository).execute({
        email: "user@example.com",
        password: "password123",
      }),
    ).resolves.toEqual(session);
    await expect(new LogoutUser(repository).execute()).resolves.toBeUndefined();
    await expect(new RestoreSession(repository).execute()).resolves.toEqual(session);
  });
});
