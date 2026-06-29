import type { AdminCategory, Category } from "../types";

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

export async function fetchPublicCategories(): Promise<Category[]> {
  const response = await fetch("/api/categories?limit=100");

  if (!response.ok) {
    throw new Error("Failed to load categories");
  }

  const json = (await response.json()) as ApiResponse<AdminCategory[]>;
  return json.data.map(toStorefrontCategory);
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

export function renderShopCategoryItem(category: Category): string {
  return `
    <li>
      <a
        href="/shop?category=${encodeURIComponent(category.slug)}"
        class="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-body transition-all hover:bg-light hover:text-primary"
      >
        <span class="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted transition-colors group-hover:text-primary"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 12H9"/></svg>
          ${escapeHtml(category.name)}
        </span>
        <span class="rounded-full bg-light px-2 py-0.5 text-xs text-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          (${category.productCount})
        </span>
      </a>
    </li>
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
