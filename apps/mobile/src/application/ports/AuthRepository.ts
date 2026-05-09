export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthSession = {
  user: AuthUser | null;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterUserInput = AuthCredentials;
export type LoginUserInput = AuthCredentials;

export type AuthRepository = {
  register(input: RegisterUserInput): Promise<AuthSession>;
  login(input: LoginUserInput): Promise<AuthSession>;
  logout(): Promise<void>;
  restoreSession(): Promise<AuthSession>;
  getCurrentUserId(): Promise<string | null>;
};
