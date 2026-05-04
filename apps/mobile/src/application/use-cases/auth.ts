import type {
  AuthRepository,
  AuthSession,
  LoginUserInput,
  RegisterUserInput,
} from "../ports/AuthRepository";

export class RegisterUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(input: RegisterUserInput): Promise<AuthSession> {
    return this.authRepository.register(input);
  }
}

export class LoginUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(input: LoginUserInput): Promise<AuthSession> {
    return this.authRepository.login(input);
  }
}

export class LogoutUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<void> {
    return this.authRepository.logout();
  }
}

export class RestoreSession {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<AuthSession> {
    return this.authRepository.restoreSession();
  }
}
