import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CreateProduct,
  FindDuplicateProductCandidates,
  GetProduct,
  SearchProducts,
} from "@/application/use-cases/products";
import { queryKeys } from "@/application/query-keys/queryKeys";
import { defaultRepositories } from "@/infrastructure/repositories/defaultRepositories";

const createProduct = new CreateProduct(
  defaultRepositories.products,
  defaultRepositories.userEvents,
);
const searchProducts = new SearchProducts(defaultRepositories.products);
const getProduct = new GetProduct(defaultRepositories.products);
const findDuplicateProductCandidates = new FindDuplicateProductCandidates(
  defaultRepositories.products,
);

export function useProductsQuery(searchTerm = "") {
  return useQuery({
    queryFn: () => searchProducts.execute({ searchTerm }),
    queryKey: queryKeys.products.search(searchTerm),
  });
}

export function useProductQuery(productId: string) {
  return useQuery({
    enabled: Boolean(productId),
    queryFn: () => getProduct.execute(productId),
    queryKey: ["product", productId] as const,
  });
}

export function useDuplicateProductCandidatesQuery(input: {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  unit?: string | null;
}) {
  return useQuery({
    enabled: Boolean(input.name.trim()),
    queryFn: () => findDuplicateProductCandidates.execute(input),
    queryKey: ["products", "duplicateCandidates", input] as const,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof createProduct.execute>[0]) =>
      createProduct.execute(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}
