import type { PropsWithChildren, ReactNode } from "react";

import { getSafeErrorMessage } from "../errors/appError";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { LoadingState } from "../ui/LoadingState";

export type AsyncStateProps = PropsWithChildren<{
  isLoading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  loadingLabel?: string;
  fallback?: ReactNode;
}>;

export function AsyncState({
  children,
  emptyMessage = "Nada para mostrar ainda.",
  emptyActionLabel,
  onEmptyAction,
  error,
  fallback,
  isEmpty = false,
  isLoading = false,
  loadingLabel = "Carregando...",
  onRetry,
  retryLabel = "Tentar novamente",
}: AsyncStateProps) {
  if (isLoading) {
    return <LoadingState label={loadingLabel} />;
  }

  if (error) {
    return (
      <ErrorState
        message={getSafeErrorMessage(error)}
        retryLabel={retryLabel}
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return (
      fallback ?? (
        <EmptyState
          actionLabel={emptyActionLabel}
          title={emptyMessage}
          onAction={onEmptyAction}
        />
      )
    );
  }

  return children;
}
