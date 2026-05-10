import { useQuery } from "@tanstack/react-query";

import {
  CalculatePriceInsight,
  GetPreviousProductPrice,
  ListProductPriceHistory,
} from "@/application/use-cases/priceHistory";
import { queryKeys } from "@/application/query-keys/queryKeys";
import { defaultRepositories } from "@/infrastructure/repositories/defaultRepositories";

const getPreviousProductPrice = new GetPreviousProductPrice(defaultRepositories.priceHistory);
const listProductPriceHistory = new ListProductPriceHistory(defaultRepositories.priceHistory);
const calculatePriceInsight = new CalculatePriceInsight(defaultRepositories.priceHistory);

export function useLatestProductPriceQuery(productId: string) {
  return useQuery({
    enabled: Boolean(productId),
    queryFn: () => getPreviousProductPrice.execute({ productId }),
    queryKey: queryKeys.products.latestPrice(productId),
  });
}

export function useProductPriceHistoryQuery(productId: string) {
  return useQuery({
    enabled: Boolean(productId),
    queryFn: () => listProductPriceHistory.execute(productId),
    queryKey: queryKeys.priceHistory.byProduct(productId),
  });
}

export function usePriceInsightQuery(productId: string, currentPrice: number) {
  return useQuery({
    enabled: Boolean(productId) && currentPrice > 0,
    queryFn: () => calculatePriceInsight.execute({ currentPrice, productId }),
    queryKey: queryKeys.priceHistory.insight(productId, currentPrice),
  });
}
