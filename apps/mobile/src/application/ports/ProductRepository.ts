export type ProductRecord = {
  id: string;
  userId: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  unit?: string | null;
};

export type ProductSearchInput = {
  searchTerm?: string;
  limit?: number;
};

export type ProductDuplicateCandidateInput = {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  unit?: string | null;
};

export type ProductRepository = {
  create(input: CreateProductInput): Promise<ProductRecord>;
  search(input: ProductSearchInput): Promise<ProductRecord[]>;
  getById(productId: string): Promise<ProductRecord | null>;
  findDuplicateCandidates(input: ProductDuplicateCandidateInput): Promise<ProductRecord[]>;
};
