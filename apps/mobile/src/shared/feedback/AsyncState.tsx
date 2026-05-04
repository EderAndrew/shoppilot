import type { PropsWithChildren, ReactNode } from "react";
import { Button, Spinner, Text, YStack } from "tamagui";

import { getSafeErrorMessage } from "../errors/appError";

export type AsyncStateProps = PropsWithChildren<{
  isLoading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  loadingLabel?: string;
  fallback?: ReactNode;
}>;

export function AsyncState({
  children,
  emptyMessage = "Nothing to show yet.",
  error,
  fallback,
  isEmpty = false,
  isLoading = false,
  loadingLabel = "Loading...",
  onRetry,
  retryLabel = "Try again",
}: AsyncStateProps) {
  if (isLoading) {
    return (
      <YStack gap="$3" style={{ alignItems: "center", padding: 20 }}>
        <Spinner />
        <Text>{loadingLabel}</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack gap="$3" style={{ padding: 20 }}>
        <Text color="$red10">{getSafeErrorMessage(error)}</Text>
        {onRetry ? <Button onPress={onRetry}>{retryLabel}</Button> : null}
      </YStack>
    );
  }

  if (isEmpty) {
    return fallback ?? (
      <YStack style={{ padding: 20 }}>
        <Text>{emptyMessage}</Text>
      </YStack>
    );
  }

  return children;
}
