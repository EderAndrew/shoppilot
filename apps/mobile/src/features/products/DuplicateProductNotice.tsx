import type { ProductRecord } from "@/application/ports/ProductRepository";
import { Text, YStack } from "tamagui";

export type DuplicateProductNoticeProps = {
  candidates: ProductRecord[];
};

export function DuplicateProductNotice({ candidates }: DuplicateProductNoticeProps) {
  if (candidates.length === 0) return null;

  return (
    <YStack
      gap="$2"
      style={{
        backgroundColor: "#fef9c3",
        borderColor: "#ca8a04",
        borderRadius: 6,
        borderWidth: 1,
        padding: 12,
      }}
    >
      <Text fontWeight="700">Já existe um produto parecido</Text>
      {candidates.slice(0, 3).map((candidate) => (
        <Text color="$gray11" key={candidate.id}>
          {candidate.name}
          {candidate.brand ? `, ${candidate.brand}` : ""}
          {candidate.unit ? ` (${candidate.unit})` : ""}
        </Text>
      ))}
    </YStack>
  );
}
