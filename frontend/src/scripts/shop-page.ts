import {
  fetchPublicAnimals,
  fetchPublicCategories,
  renderShopCategoryItem,
} from "../lib/categories";
import {
  fetchPublicProducts,
  renderBestSellerItem,
  renderShopProductCard,
} from "../lib/products";
import { addToCart } from "../stores/cartStore";
import type { AdminCategory, Animal, Product } from "../types";

let products: Product[] = [];
let categories: AdminCategory[] = [];
let animals: Animal[] = [];

let animalFilter: number | null = null;
let categoryFilter = "";
let tagFilter = "";
let sortBy = "default";
let appliedPriceMin = 0;
let appliedPriceMax = 0;
let priceBounds = { min: 0, max: 1000 };
let priceFilterActive = false;

export async function initShopPage(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  categoryFilter = params.get("category") ?? "";
  tagFilter = params.get("tag") ?? "";

  bindEvents();

  try {
    const [productsData, categoriesData, animalsData] = await Promise.all([
      fetchPublicProducts({ limit: 100 }),
      fetchPublicCategories(),
      fetchPublicAnimals(),
    ]);

    products = productsData;
    categories = categoriesData;
    animals = animalsData;

    if (categoryFilter) {
      const category = categories.find((item) => item.slug === categoryFilter);
      if (category) animalFilter = category.animalId;
    }

    initPriceBounds();
    syncPriceInputs();
    populateAnimalFilter();
    renderCategoryList();
    renderBestSellers();
    renderProducts();
    highlightActiveTag();
  } catch {
    const grid = document.getElementById("shop-products-grid");
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-sm text-muted">
          Unable to load products. Please try again later.
        </div>
      `;
    }
  }
}

function bindEvents(): void {
  document.getElementById("shop-animal-filter")?.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    animalFilter = value ? Number(value) : null;
    categoryFilter = "";
    renderCategoryList();
    updateUrl();
    renderProducts();
  });

  document.getElementById("shop-sort")?.addEventListener("change", (event) => {
    sortBy = (event.target as HTMLSelectElement).value;
    renderProducts();
  });

  document.getElementById("price-min")?.addEventListener("input", handlePriceInput);
  document.getElementById("price-max")?.addEventListener("input", handlePriceInput);

  document.getElementById("price-filter-btn")?.addEventListener("click", () => {
    const minInput = document.getElementById("price-min") as HTMLInputElement;
    const maxInput = document.getElementById("price-max") as HTMLInputElement;
    appliedPriceMin = Number(minInput.value);
    appliedPriceMax = Number(maxInput.value);
    priceFilterActive = true;
    renderProducts();
  });

  document.getElementById("clear-filters-btn")?.addEventListener("click", () => {
    clearAllFilters();
  });

  document.querySelectorAll<HTMLButtonElement>(".shop-tag-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag ?? "";
      tagFilter = tagFilter === tag ? "" : tag;
      highlightActiveTag();
      updateUrl();
      renderProducts();
    });
  });
}

function initPriceBounds(): void {
  if (products.length === 0) return;

  const prices = products.map((product) => product.price);
  priceBounds = {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  };

  appliedPriceMin = priceBounds.min;
  appliedPriceMax = priceBounds.max;
  priceFilterActive = false;
}

function syncPriceInputs(): void {
  const minInput = document.getElementById("price-min") as HTMLInputElement | null;
  const maxInput = document.getElementById("price-max") as HTMLInputElement | null;
  const label = document.getElementById("price-range-label");
  const track = document.getElementById("price-range-track");

  if (minInput) {
    minInput.min = String(priceBounds.min);
    minInput.max = String(priceBounds.max);
    minInput.value = String(appliedPriceMin);
  }

  if (maxInput) {
    maxInput.min = String(priceBounds.min);
    maxInput.max = String(priceBounds.max);
    maxInput.value = String(appliedPriceMax);
  }

  updatePriceLabel(label);
  updatePriceTrack(track, minInput, maxInput);
}

function handlePriceInput(): void {
  const minInput = document.getElementById("price-min") as HTMLInputElement;
  const maxInput = document.getElementById("price-max") as HTMLInputElement;

  let minValue = Number(minInput.value);
  let maxValue = Number(maxInput.value);

  if (minValue > maxValue) {
    if (document.activeElement === minInput) {
      maxValue = minValue;
      maxInput.value = String(maxValue);
    } else {
      minValue = maxValue;
      minInput.value = String(minValue);
    }
  }

  updatePriceLabel(document.getElementById("price-range-label"));
  updatePriceTrack(
    document.getElementById("price-range-track"),
    minInput,
    maxInput,
  );
}

function updatePriceLabel(label: HTMLElement | null): void {
  if (!label) return;

  const minInput = document.getElementById("price-min") as HTMLInputElement;
  const maxInput = document.getElementById("price-max") as HTMLInputElement;
  label.textContent = `Price: $${Number(minInput.value).toFixed(0)} — $${Number(maxInput.value).toFixed(0)}`;
}

function updatePriceTrack(
  track: HTMLElement | null,
  minInput: HTMLInputElement | null,
  maxInput: HTMLInputElement | null,
): void {
  if (!track || !minInput || !maxInput) return;

  const range = priceBounds.max - priceBounds.min || 1;
  const minPercent = ((Number(minInput.value) - priceBounds.min) / range) * 100;
  const maxPercent = ((Number(maxInput.value) - priceBounds.min) / range) * 100;

  track.style.left = `${minPercent}%`;
  track.style.width = `${maxPercent - minPercent}%`;
}

function populateAnimalFilter(): void {
  const select = document.getElementById(
    "shop-animal-filter",
  ) as HTMLSelectElement | null;
  if (!select) return;

  select.innerHTML = [
    '<option value="">All animals</option>',
    ...animals.map(
      (animal) =>
        `<option value="${animal.id}">${escapeHtml(animal.name)}</option>`,
    ),
  ].join("");

  select.value = animalFilter !== null ? String(animalFilter) : "";
}

function renderCategoryList(): void {
  const list = document.getElementById("shop-category-list");
  if (!list) return;

  if (!animalFilter) {
    list.innerHTML = `
      <li class="rounded-lg border border-dashed border-border bg-light px-3 py-2.5 text-sm text-body">
        Select an animal to browse categories.
      </li>
    `;
    return;
  }

  const filtered = categories.filter(
    (category) => category.animalId === animalFilter,
  );

  if (filtered.length === 0) {
    list.innerHTML = `
      <li class="px-3 py-2 text-sm text-muted">No categories for this animal.</li>
    `;
    return;
  }

  list.innerHTML = [
    `<li>
      <button
        type="button"
        data-category-slug=""
        class="shop-category-btn group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
          !categoryFilter
            ? "bg-primary/10 font-medium text-primary"
            : "text-body hover:bg-light hover:text-primary"
        }"
      >
        <span>All categories</span>
      </button>
    </li>`,
    ...filtered.map((category) =>
      renderShopCategoryItem(category, animals, categoryFilter),
    ),
  ].join("");

  list.querySelectorAll<HTMLButtonElement>(".shop-category-btn").forEach(
    (button) => {
      button.addEventListener("click", () => {
        categoryFilter = button.dataset.categorySlug ?? "";
        renderCategoryList();
        updateUrl();
        renderProducts();
      });
    },
  );

}

function getFilteredProducts(): Product[] {
  let result = [...products];

  if (animalFilter !== null) {
    const categoryNames = new Set(
      categories
        .filter((category) => category.animalId === animalFilter)
        .map((category) => category.name),
    );

    result = result.filter((product) => categoryNames.has(product.category));
  }

  if (categoryFilter) {
    const category = categories.find((item) => item.slug === categoryFilter);
    if (category) {
      result = result.filter((product) => product.category === category.name);
    }
  }

  if (tagFilter) {
    result = result.filter((product) => productMatchesTag(product, tagFilter));
  }

  if (priceFilterActive) {
    result = result.filter(
      (product) =>
        product.price >= appliedPriceMin && product.price <= appliedPriceMax,
    );
  }

  switch (sortBy) {
    case "popularity":
      result.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    default:
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return result;
}

function renderProducts(): void {
  const grid = document.getElementById("shop-products-grid");
  const countEl = document.getElementById("shop-results-count");
  if (!grid) return;

  const filtered = getFilteredProducts();

  if (countEl) {
    const total = products.length;
    countEl.textContent =
      filtered.length === 0
        ? "Showing 0 results"
        : filtered.length === total
          ? `Showing 1–${total} of ${total} results`
          : `Showing ${filtered.length} of ${total} results`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <p class="text-base font-medium text-heading">No products found</p>
        <p class="mt-1 text-sm text-muted">Try changing your filters.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(renderShopProductCard).join("");
  bindAddToCart(filtered);
}

function bindAddToCart(items: Product[]): void {
  document.querySelectorAll<HTMLButtonElement>("[data-add-to-cart]").forEach(
    (button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.productId;
        const product = items.find((item) => item.id === id);
        if (product) addToCart(product);
      });
    },
  );
}

function renderBestSellers(): void {
  const container = document.getElementById("shop-best-sellers");
  if (!container) return;

  const bestSellers = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);

  container.innerHTML =
    bestSellers.length > 0
      ? `<div class="space-y-4">${bestSellers.map(renderBestSellerItem).join("")}</div>`
      : `<p class="text-sm text-muted">No products yet.</p>`;
}

function highlightActiveTag(): void {
  document.querySelectorAll<HTMLButtonElement>(".shop-tag-btn").forEach(
    (button) => {
      const isActive = button.dataset.tag === tagFilter;
      button.classList.toggle("border-primary", isActive);
      button.classList.toggle("text-primary", isActive);
      button.classList.toggle("bg-primary/5", isActive);
    },
  );
}

function productMatchesTag(product: Product, tag: string): boolean {
  const needle = tag.toLowerCase();
  const category = categories.find((item) => item.name === product.category);
  const values = [
    product.name,
    product.category,
    category?.slug ?? "",
    ...product.tags,
  ];

  return values.some((value) => value.toLowerCase().includes(needle));
}

function clearAllFilters(): void {
  animalFilter = null;
  categoryFilter = "";
  tagFilter = "";
  priceFilterActive = false;

  const animalSelect = document.getElementById(
    "shop-animal-filter",
  ) as HTMLSelectElement | null;
  if (animalSelect) animalSelect.value = "";

  initPriceBounds();
  syncPriceInputs();
  populateAnimalFilter();
  renderCategoryList();
  highlightActiveTag();
  updateUrl();
  renderProducts();
}

function updateUrl(): void {
  const params = new URLSearchParams();
  if (categoryFilter) params.set("category", categoryFilter);
  if (tagFilter) params.set("tag", tagFilter);

  const query = params.toString();
  const nextUrl = query ? `/shop?${query}` : "/shop";
  window.history.replaceState({}, "", nextUrl);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
