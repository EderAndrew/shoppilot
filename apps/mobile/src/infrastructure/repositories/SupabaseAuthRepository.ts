import type { AuthRepository, AuthSession } from "@/application/ports/AuthRepository";
import { toAppError } from "@/shared/errors/appError";

import { supabase, type ShopPilotSupabaseClient } from "../supabase/client";

function toAuthSession(user: { id: string; email?: string | null } | null): AuthSession {
  return {
    user: user ? { email: user.email ?? null, id: user.id } : null,
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: ShopPilotSupabaseClient = supabase) {}

  async register(input: { email: string; password: string }): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (error) throw toAppError(error, "validation_error");
    return toAuthSession(data.user);
  }

  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) throw toAppError(error, "auth_required");
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
