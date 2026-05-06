import { Money, type MoneyInput } from "../value-objects/Money";

export type PriceInsightStatus = "more_expensive" | "cheaper" | "unchanged" | "no_history";

export type PriceInsight = {
  status: PriceInsightStatus;
  currentPrice: number;
  previousPrice: number | null;
  absoluteDifference: number | null;
  percentageDifference: number | null;
};

function percentageDifference(current: Money, previous: Money): number {
  return Math.round(((current.cents - previous.cents) / previous.cents) * 10_000) / 100;
}

export function calculatePriceInsight(
  currentPriceInput: MoneyInput,
  previousPriceInput?: MoneyInput | null,
): PriceInsight {
  const currentPrice = Money.positive(currentPriceInput);

  if (previousPriceInput === null || previousPriceInput === undefined) {
    return {
      absoluteDifference: null,
      currentPrice: currentPrice.toNumber(),
      percentageDifference: null,
      previousPrice: null,
      status: "no_history",
    };
  }

  const previousPrice = Money.positive(previousPriceInput);
  const difference = currentPrice.subtract(previousPrice);
  const absoluteDifference = difference.toNumber();
  const status: PriceInsightStatus =
    difference.cents > 0 ? "more_expensive" : difference.cents < 0 ? "cheaper" : "unchanged";

  return {
    absoluteDifference,
    currentPrice: currentPrice.toNumber(),
    percentageDifference: percentageDifference(currentPrice, previousPrice),
    previousPrice: previousPrice.toNumber(),
    status,
  };
}
