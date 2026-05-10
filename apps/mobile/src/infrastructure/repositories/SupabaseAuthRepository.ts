import type { AuthRepository, AuthSession } from "@/application/ports/AuthRepository";
import { createAppError, toAppError } from "@/shared/errors/appError";

import { supabase, type ShopPilotSupabaseClient } from "../supabase/client";

type SupabaseAuthUser = { id: string; email?: string | null } | null;
type SupabaseAuthError = {
  message?: string;
  status?: number;
};

function toAuthSession(user: SupabaseAuthUser): AuthSession {
  return {
    user: user ? { email: user.email ?? null, id: user.id } : null,
  };
}

function getAuthErrorMessage(error: SupabaseAuthError, fallback: string): string {
  const message = error.message?.trim();
  if (!message) return fallback;

  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Email ou senha incorretos.";
  }

  if (message.toLowerCase().includes("email not confirmed")) {
    return "Confirme seu email antes de entrar.";
  }

  if (message.toLowerCase().includes("already registered")) {
    return "Este email já está cadastrado. Entre em vez de criar uma conta.";
  }

  return message;
}

function toAuthAppError(error: SupabaseAuthError, fallback: string): Error {
  const message = getAuthErrorMessage(error, fallback);

  return createAppError({
    category: error.status === 409 ? "conflict" : "auth_required",
    cause: error,
    message,
  });
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: ShopPilotSupabaseClient = supabase) {}

  async register(input: { email: string; password: string }): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (error) throw toAuthAppError(error, "Não foi possível criar sua conta.");
    return toAuthSession(data.session?.user ?? null);
  }

  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) throw toAuthAppError(error, "Não foi possível entrar.");
    return toAuthSession(data.user);
  }

  async logout(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw toAppError(error, "unexpected");
  }

  async restoreSession(): Promise<AuthSession> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw toAppError(error, "auth_required");
    return toAuthSession(data.session?.user ?? null);
  }

  async getCurrentUserId(): Promise<string | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error) return null;
    return data.user?.id ?? null;
  }
}
