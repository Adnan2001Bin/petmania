import { api } from "../api";
import type { AdminProduct } from "../../types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number;
  sku: string;
  image: string;
  categoryId: number;
  inStock?: boolean;
  tags?: string[];
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

function normalizeProduct(product: AdminProduct): AdminProduct {
  return {
    ...product,
    price: Number(product.price),
    oldPrice:
      product.oldPrice != null ? Number(product.oldPrice) : null,
    rating: Number(product.rating),
  };
}

export async function fetchProducts(params?: {
  limit?: number;
  search?: string;
  category?: string;
}): Promise<AdminProduct[]> {
  const { data } = await api.get<ApiResponse<AdminProduct[]>>("/api/products", {
    params: {
      page: 1,
      limit: params?.limit ?? 100,
      all: true,
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.category ? { category: params.category } : {}),
    },
  });

  return data.data.map(normalizeProduct);
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<AdminProduct> {
  const { data } = await api.post<ApiResponse<AdminProduct>>(
    "/api/products",
    payload,
  );
  return normalizeProduct(data.data);
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<AdminProduct> {
  const { data } = await api.put<ApiResponse<AdminProduct>>(
    `/api/products/${id}`,
    payload,
  );
  return normalizeProduct(data.data);
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/api/products/${id}`);
}

export { slugify } from "./categories";
