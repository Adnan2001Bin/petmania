import type { AdminCategory, Animal, Category } from "../types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const PLACEHOLDER_IMAGE = "/images/categories/category-1.jpg";

export function toStorefrontCategory(category: AdminCategory): Category {
  return {
    id: String(category.id),
    slug: category.slug,
    name: category.name,
    image: category.image || PLACEHOLDER_IMAGE,
    productCount: category._count?.products ?? 0,
  };
}

export async function fetchPublicCategories(): Promise<AdminCategory[]> {
  const response = await fetch("/api/categories?limit=100");

  if (!response.ok) {
    throw new Error("Failed to load categories");
  }

  const json = (await response.json()) as ApiResponse<AdminCategory[]>;
  return json.data;
}

export async function fetchPublicAnimals(): Promise<Animal[]> {
  const response = await fetch("/api/animals");

  if (!response.ok) {
    throw new Error("Failed to load animals");
  }

  const json = (await response.json()) as ApiResponse<Animal[]>;
  return json.data;
}

export function getCategoryLabel(
  category: AdminCategory,
  animals: Animal[],
): string {
  const animalName =
    category.animal?.name ??
    animals.find((animal) => animal.id === category.animalId)?.name;

  if (!animalName) return category.name;

  const prefix = new RegExp(
    `^${animalName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`,
    "i",
  );
  return category.name.replace(prefix, "").trim() || category.name;
}

export function renderShopCategoryItem(
  category: AdminCategory,
  animals: Animal[],
  activeSlug = "",
): string {
  const isActive = activeSlug === category.slug;

  return `
    <li>
      <button
        type="button"
        data-category-slug="${escapeHtml(category.slug)}"
        class="shop-category-btn group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
          isActive
            ? "bg-primary/10 font-medium text-primary"
            : "text-body hover:bg-light hover:text-primary"
        }"
      >
        <span class="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${isActive ? "text-primary" : "text-muted transition-colors group-hover:text-primary"}"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 12H9"/></svg>
          ${escapeHtml(getCategoryLabel(category, animals))}
        </span>
        <span class="rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-primary/10 text-primary" : "bg-light text-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary"}">
          (${category._count?.products ?? 0})
        </span>
      </button>
    </li>
  `;
}

export function renderCategoryCard(category: Category): string {
  const image = category.image || PLACEHOLDER_IMAGE;

  return `
    <a
      href="/shop?category=${encodeURIComponent(category.slug)}"
      class="group block text-center"
    >
      <div class="relative mb-4 aspect-square overflow-hidden rounded-full border-2 border-transparent bg-white shadow-sm transition-colors duration-300 group-hover:border-primary">
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(category.name)}"
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <h3 class="text-base font-bold text-heading transition-colors group-hover:text-primary">
        ${escapeHtml(category.name)}
      </h3>
    </a>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
