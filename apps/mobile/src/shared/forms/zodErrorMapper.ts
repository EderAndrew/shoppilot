import { z } from "zod";

import { createAppError, type AppError } from "../errors/appError";

export type FormFieldErrors = Record<string, string>;

function formatIssuePath(path: PropertyKey[]): string {
  return path.map(String).join(".");
}

export function getZodFieldErrors(error: z.ZodError): FormFieldErrors {
  return error.issues.reduce<FormFieldErrors>((fieldErrors, issue) => {
    const path = formatIssuePath(issue.path);
    if (path.length === 0 || fieldErrors[path]) return fieldErrors;

    return {
      ...fieldErrors,
      [path]: issue.message,
    };
  }, {});
}

export function mapZodErrorToAppError(error: z.ZodError): AppError {
  const firstIssue = error.issues[0];

  return createAppError({
    category: "validation_error",
    cause: error,
    message: firstIssue?.message ?? "Verifique o formulário e tente novamente.",
  });
}

export function mapUnknownValidationError(error: unknown): AppError {
  if (error instanceof z.ZodError) return mapZodErrorToAppError(error);

  return createAppError({
    category: "validation_error",
    cause: error,
    message: "Verifique o formulário e tente novamente.",
  });
}
