import { QueryClient } from "@tanstack/react-query";

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const category =
    typeof error === "object" && error !== null && "category" in error
      ? error.category
      : undefined;

  if (
    category === "validation_error" ||
    category === "auth_required" ||
    category === "forbidden" ||
    category === "not_found" ||
    category === "conflict"
  ) {
    return false;
  }

  return failureCount < 2;
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        staleTime: 30_000,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
