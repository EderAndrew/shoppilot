import {
  createContext,
  createElement,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { AuthSession, AuthUser } from "../../application/ports/AuthRepository";

export type AuthState = "loading" | "authenticated" | "unauthenticated";

export type AuthSessionContextValue = {
  session: AuthSession;
  user: AuthUser | null;
  state: AuthState;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

const emptySession: AuthSession = { user: null };

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export type AuthSessionProviderProps = PropsWithChildren<{
  initialSession?: AuthSession;
  initialState?: AuthState;
}>;

export function AuthSessionProvider({
  children,
  initialSession = emptySession,
  initialState,
}: AuthSessionProviderProps) {
  const [session, setSession] = useState<AuthSession>(initialSession);
  const [state, setState] = useState<AuthState>(
    initialState ?? (initialSession.user ? "authenticated" : "unauthenticated"),
  );

  const updateSession = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    setState(nextSession.user ? "authenticated" : "unauthenticated");
  }, []);

  const clearSession = useCallback(() => {
    updateSession(emptySession);
  }, [updateSession]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      clearSession,
      isAuthenticated: state === "authenticated",
      isLoading: state === "loading",
      session,
      setSession: updateSession,
      state,
      user: session.user,
    }),
    [clearSession, session, state, updateSession],
  );

  return createElement(
    AuthSessionContext.Provider,
    { value },
    children,
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider.");
  }

  return context;
}
