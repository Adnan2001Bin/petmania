import { apiGet } from "./fetch-api";
import type { Product } from "../types";

interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string | number;
  oldPrice?: string | number | null;
  sku: string;
  image: string;
  rating: string | number;
  reviewCount: number;
  inStock: boolean;
  category?: { id: number; name: string; slug: string };
  tags?: { tag: { id: string; name: string } }[];
}

export function toStorefrontProduct(api: ApiProduct): Product {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    description: api.description,
    price: Number(api.price),
    oldPrice:
      api.oldPrice != null && api.oldPrice !== ""
        ? Number(api.oldPrice)
        : undefined,
    sku: api.sku,
    image: api.image,
    rating: Number(api.rating),
    reviewCount: api.reviewCount,
    category: api.category?.name ?? "",
    tags: api.tags?.map((item) => item.tag.name) ?? [],
    inStock: api.inStock,
  };
}

export async function fetchPublicProducts(params?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
  all?: boolean;
}): Promise<Product[]> {
  const query = new URLSearchParams({
    page: "1",
    limit: String(params?.limit ?? 100),
  });

  if (params?.all) query.set("all", "true");

  if (params?.category) query.set("category", params.category);
  if (params?.minPrice != null) query.set("minPrice", String(params.minPrice));
  if (params?.maxPrice != null) query.set("maxPrice", String(params.maxPrice));
  if (params?.search) query.set("search", params.search);

  const products = await apiGet<ApiProduct[]>(`/products?${query.toString()}`);
  return products.map(toStorefrontProduct);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const product = await apiGet<ApiProduct>(`/products/slug/${slug}`);
    return toStorefrontProduct(product);
  } catch {
    return null;
  }
}

function renderStars(rating: number): string {
  return Array.from({ length: 5 })
    .map((_, index) => {
      const filled = index < Math.round(rating);
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="${filled ? "#ffcb45" : "none"}" stroke="#ffcb45" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderShopProductCard(product: Product): string {
  const saleBadge = product.oldPrice
    ? `<div class="absolute left-4 top-4 z-10"><span class="inline-flex items-center rounded-full bg-sale px-2.5 py-1 text-xs font-semibold text-white">Sale</span></div>`
    : "";

  return `
    <div class="group flex h-full flex-col overflow-hidden rounded-lg bg-white transition-all duration-300 hover:shadow-hover">
      <a href="/product/${escapeHtml(product.slug)}" class="product-card-image relative block w-full shrink-0 overflow-hidden bg-light">
        <img
          src="${escapeHtml(product.image)}"
          alt="${escapeHtml(product.name)}"
          class="product-card-img absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        ${saleBadge}
      </a>
      <div class="flex flex-1 flex-col px-5 pb-5 pt-4">
        <div class="mb-2 flex items-center gap-2">
          <span class="text-lg font-bold text-primary">$${product.price.toFixed(2)}</span>
          ${
            product.oldPrice
              ? `<span class="text-sm text-muted line-through">$${product.oldPrice.toFixed(2)}</span>`
              : ""
          }
        </div>
        <a href="/product/${escapeHtml(product.slug)}" class="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-heading transition-colors hover:text-primary">
          ${escapeHtml(product.name)}
        </a>
        <div class="mt-auto flex items-center gap-1.5">
          <div class="flex items-center">${renderStars(product.rating)}</div>
          <span class="text-xs text-muted">(${product.reviewCount})</span>
        </div>
        <button
          type="button"
          data-add-to-cart
          data-product-id="${escapeHtml(product.id)}"
          class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-white opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-primary"
        >
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

export function renderBestSellerItem(product: Product): string {
  return `
    <a href="/product/${escapeHtml(product.slug)}" class="group flex items-center gap-3">
      <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-light">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="h-full w-full object-cover" loading="lazy" />
      </div>
      <div class="min-w-0 flex-1">
        <h4 class="truncate text-sm font-semibold text-heading transition-colors group-hover:text-primary">${escapeHtml(product.name)}</h4>
        <div class="my-1 flex items-center gap-1">
          ${renderStars(product.rating)}
          <span class="text-xs text-muted">(${product.reviewCount})</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-primary">$${product.price.toFixed(2)}</span>
          ${
            product.oldPrice
              ? `<span class="text-xs text-muted line-through">$${product.oldPrice.toFixed(2)}</span>`
              : ""
          }
        </div>
      </div>
    </a>
  `;
}
