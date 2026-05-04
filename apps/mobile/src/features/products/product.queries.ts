import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CreateProduct } from "@/application/use-cases/products";
import { queryKeys } from "@/application/query-keys/queryKeys";
import { defaultRepositories } from "@/infrastructure/repositories/defaultRepositories";

const createProduct = new CreateProduct(defaultRepositories.products);

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
