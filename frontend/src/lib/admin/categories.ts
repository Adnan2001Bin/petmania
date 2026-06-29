import { api } from "../api";
import type { Animal, AdminCategory } from "../../types";

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

export interface CreateAnimalPayload {
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export async function createAnimal(
  payload: CreateAnimalPayload,
): Promise<Animal> {
  const { data } = await api.post<ApiResponse<Animal>>("/api/animals", payload);
  return data.data;
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  animalId: number;
}

export async function fetchAnimals(): Promise<Animal[]> {
  const { data } = await api.get<ApiResponse<Animal[]>>("/api/animals");
  return data.data;
}

export async function fetchCategories(params?: {
  animalId?: number;
  limit?: number;
}): Promise<AdminCategory[]> {
  const { data } = await api.get<ApiResponse<AdminCategory[]>>("/api/categories", {
    params: {
      page: 1,
      limit: params?.limit ?? 100,
      ...(params?.animalId ? { animalId: params.animalId } : {}),
    },
  });
  return data.data;
}

export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<AdminCategory> {
  const { data } = await api.post<ApiResponse<AdminCategory>>(
    "/api/categories",
    payload,
  );
  return data.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/api/categories/${id}`);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildCategoryFromAnimal(
  animal: Pick<Animal, "name" | "slug">,
  typeLabel: string,
): { name: string; slug: string } {
  const trimmedType = typeLabel.trim();
  return {
    name: `${animal.name} ${trimmedType}`,
    slug: slugify(`${animal.slug}-${trimmedType}`),
  };
}
