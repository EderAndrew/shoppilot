import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  AuthSession,
  LoginUserInput,
  RegisterUserInput,
} from "@/application/ports/AuthRepository";
import { LoginUser, LogoutUser, RegisterUser, RestoreSession } from "@/application/use-cases/auth";
import { queryKeys } from "@/application/query-keys/queryKeys";
import { defaultRepositories } from "@/infrastructure/repositories/defaultRepositories";

import { useAuthSession } from "./useAuthSession";

export function useRestoreSessionQuery() {
  const { setSession } = useAuthSession();

  return useQuery({
    queryFn: async () => {
      const session = await new RestoreSession(defaultRepositories.auth).execute();
      setSession(session);
      return session;
    },
    queryKey: queryKeys.auth.session(),
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { setSession } = useAuthSession();
  const login = new LoginUser(defaultRepositories.auth);

  return useMutation<AuthSession, unknown, LoginUserInput>({
    mutationFn: (input) => login.execute(input),
    onSuccess: async (session) => {
      setSession(session);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const { setSession } = useAuthSession();
  const register = new RegisterUser(defaultRepositories.auth);

  return useMutation<AuthSession, unknown, RegisterUserInput>({
    mutationFn: (input) => register.execute(input),
    onSuccess: async (session) => {
      setSession(session);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { clearSession } = useAuthSession();

  return useMutation({
    mutationFn: () => new LogoutUser(defaultRepositories.auth).execute(),
    onSuccess: async () => {
      clearSession();
      await queryClient.clear();
    },
  });
}
