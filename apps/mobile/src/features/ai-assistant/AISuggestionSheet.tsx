import React from "react";
import { TextInput, ScrollView } from "react-native";
import { Sheet, YStack, XStack, Text, Spinner } from "tamagui";

import type { SuggestedItem } from "@/domain/entities/AISuggestion";
import { useUiStore } from "@/shared/state/uiStore";
import { colors, radius, spacing, typography } from "@/shared/design-system/tokens";
import { AppButton } from "@/shared/ui/AppButton";
import { useAISuggestMutation } from "./useAISuggestMutation";
import { useConfirmSuggestions } from "./useConfirmSuggestions";
import { SuggestionItemRow } from "./SuggestionItemRow";

interface Props {
  listId: string;
  listName: string;
  existingItemNames: string[];
}

export function AISuggestionSheet({ listId, listName, existingItemNames }: Props) {
  const { isAIAssistantOpen, setAIAssistantOpen } = useUiStore();
  const { mutate, status, data, reset } = useAISuggestMutation();
  const { confirm, isConfirming, progress: confirmProgress } = useConfirmSuggestions(listId);
  const [prompt, setPrompt] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const textAreaRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (isAIAssistantOpen && status === "idle") {
      const timer = setTimeout(() => textAreaRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isAIAssistantOpen, status]);

  React.useEffect(() => {
    if (status === "success" && data) {
      setSelectedIds(
        new Set(data.suggestions.filter((s) => s.status === "pending").map((s) => s.id)),
      );
    }
  }, [status, data]);

  function handleClose() {
    setAIAssistantOpen(false);
    reset();
    setPrompt("");
    setSelectedIds(new Set());
  }

  function handleSubmit() {
    if (!prompt.trim()) return;
    mutate({ prompt: prompt.trim(), listId, listName, existingItemNames });
  }

  async function handleConfirm(selected: SuggestedItem[]) {
    await confirm(selected);
    handleClose();
  }

  function handleRetry() {
    reset();
    setPrompt("");
    setSelectedIds(new Set());
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const suggestions: SuggestedItem[] = data?.suggestions ?? [];

  return (
    <Sheet
      open={isAIAssistantOpen}
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
      snapPoints={[85, 50]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame>
        <YStack style={{ padding: spacing.screenPadding, flex: 1, gap: spacing.sectionGap }}>
          {/* Idle — prompt input */}
          {status === "idle" ? (
            <YStack gap={spacing.formSectionGap}>
              <Text
                style={{
                  fontSize: typography.sectionTitle.fontSize,
                  fontWeight: typography.sectionTitle.fontWeight,
                  color: colors.textPrimary,
                }}
              >
                Sugestões de IA
              </Text>
              <TextInput
                ref={textAreaRef}
                accessibilityLabel="Descreva o que você precisa comprar"
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Ex: lista para churrasco com 10 pessoas"
                multiline
                numberOfLines={4}
                maxLength={500}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.input,
                  backgroundColor: colors.surface,
                  paddingHorizontal: spacing.controlPaddingH,
                  paddingVertical: spacing.controlPaddingV,
                  fontSize: typography.body.fontSize,
                  color: colors.textPrimary,
                  minHeight: 96,
                  textAlignVertical: "top",
                }}
              />
              <XStack style={{ justifyContent: "flex-end" }}>
                <Text
                  style={{
                    fontSize: typography.caption.fontSize,
                    color: colors.textSecondary,
                  }}
                >
                  {prompt.length}/500
                </Text>
              </XStack>
              <AppButton
                accessibilityLabel="Gerar sugestões"
                disabled={!prompt.trim()}
                onPress={handleSubmit}
              >
                Sugerir itens
              </AppButton>
            </YStack>
          ) : null}

          {/* Loading state */}
          {status === "pending" ? (
            <YStack
              style={{
                alignItems: "center",
                gap: spacing.sectionGap,
                paddingVertical: spacing.screenGap * 2,
              }}
            >
              <Spinner color={colors.primary} size="large" />
              <Text
                style={{
                  fontSize: typography.body.fontSize,
                  color: colors.textSecondary,
                }}
              >
                Gerando sugestões…
              </Text>
              <AppButton
                accessibilityLabel="Cancelar geração de sugestões"
                variant="secondary"
                size="sm"
                onPress={handleClose}
              >
                Cancelar
              </AppButton>
            </YStack>
          ) : null}

          {/* Error state */}
          {status === "error" ? (
            <YStack gap={spacing.formSectionGap}>
              <Text
                accessibilityRole="alert"
                style={{
                  fontSize: typography.body.fontSize,
                  color: colors.danger,
                }}
              >
                Não foi possível gerar sugestões. Verifique sua conexão e tente novamente.
              </Text>
              <AppButton
                accessibilityLabel="Tentar gerar sugestões novamente"
                onPress={handleRetry}
              >
                Tentar novamente
              </AppButton>
              <AppButton
                accessibilityLabel="Fechar assistente de IA"
                variant="secondary"
                onPress={handleClose}
              >
                Fechar
              </AppButton>
            </YStack>
          ) : null}

          {/* Empty suggestions state */}
          {status === "success" && suggestions.length === 0 ? (
            <YStack gap={spacing.formSectionGap}>
              <Text
                style={{
                  fontSize: typography.body.fontSize,
                  color: colors.textPrimary,
                }}
              >
                Nenhuma sugestão gerada para este pedido. Tente descrever com mais detalhes.
              </Text>
              <AppButton
                accessibilityLabel="Tentar gerar sugestões novamente"
                onPress={handleRetry}
              >
                Tentar novamente
              </AppButton>
            </YStack>
          ) : null}

          {/* Success — suggestions list with selection */}
          {status === "success" && suggestions.length > 0 ? (
            <YStack style={{ flex: 1, gap: spacing.sectionGap }}>
              <XStack
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: typography.sectionTitle.fontSize,
                    fontWeight: typography.sectionTitle.fontWeight,
                    color: colors.textPrimary,
                  }}
                >
                  Sugestões
                </Text>
                <AppButton
                  accessibilityLabel="Iniciar nova busca de sugestões"
                  variant="secondary"
                  size="sm"
                  onPress={handleRetry}
                >
                  Nova busca
                </AppButton>
              </XStack>
              <ScrollView style={{ flex: 1 }}>
                {suggestions.map((suggestion) => (
                  <SuggestionItemRow
                    key={suggestion.id}
                    suggestion={suggestion}
                    isSelected={selectedIds.has(suggestion.id)}
                    onToggle={toggleItem}
                  />
                ))}
              </ScrollView>
              <AppButton
                accessibilityLabel={`Adicionar ${selectedIds.size} itens à lista`}
                disabled={selectedIds.size === 0 || isConfirming}
                loading={isConfirming}
                onPress={() => handleConfirm(suggestions.filter((s) => selectedIds.has(s.id)))}
              >
                {isConfirming
                  ? `Adicionando ${confirmProgress} de ${selectedIds.size}…`
                  : `Adicionar ${selectedIds.size} ${selectedIds.size === 1 ? "item" : "itens"}`}
              </AppButton>
            </YStack>
          ) : null}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
