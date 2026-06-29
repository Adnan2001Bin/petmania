import {
  createProduct,
  deleteProduct,
  fetchProducts,
  slugify,
} from "../lib/admin/products";
import { fetchCategories, fetchAnimals } from "../lib/admin/categories";
import type { AdminCategory, AdminProduct, Animal } from "../types";

let products: AdminProduct[] = [];
let categories: AdminCategory[] = [];
let animals: Animal[] = [];
let searchQuery = "";
let categoryFilter = "";
let confirmResolve: ((value: boolean) => void) | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function initProductsPage(): void {
  const page = document.getElementById("products-page");
  if (!page) return;

  bindEvents();
  loadData();
}

function bindEvents(): void {
  document.getElementById("add-product-btn")?.addEventListener("click", openModal);
  document
    .getElementById("product-modal-close-btn")
    ?.addEventListener("click", closeModal);
  document
    .getElementById("product-modal-cancel-btn")
    ?.addEventListener("click", closeModal);
  document
    .getElementById("product-modal-backdrop")
    ?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeModal();
    });
  document.getElementById("product-form")?.addEventListener("submit", handleSubmit);

  document.getElementById("product-name")?.addEventListener("input", (event) => {
    const slugInput = document.getElementById(
      "product-slug",
    ) as HTMLInputElement | null;
    const nameInput = event.target as HTMLInputElement;
    if (!slugInput || slugInput.dataset.manual === "true") return;
    slugInput.value = slugify(nameInput.value);
  });

  document.getElementById("product-slug")?.addEventListener("input", (event) => {
    const slugInput = event.target as HTMLInputElement;
    slugInput.dataset.manual = slugInput.value ? "true" : "false";
  });

  document
    .getElementById("product-animal")
    ?.addEventListener("change", handleProductAnimalChange);

  document.getElementById("category-filter")?.addEventListener("change", (event) => {
    categoryFilter = (event.target as HTMLSelectElement).value;
    renderTable();
    updateSubtitle();
  });

  document.getElementById("product-search")?.addEventListener("input", (event) => {
    searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
    renderTable();
    updateSubtitle();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!document.getElementById("confirm-dialog")?.classList.contains("hidden")) {
        closeConfirmDialog(false);
        return;
      }
      closeModal();
    }
  });

  bindConfirmDialog();
}

async function loadData(): Promise<void> {
  setLoading(true);
  hideError();

  try {
    const [productsData, categoriesData, animalsData] = await Promise.all([
      fetchProducts({ limit: 100 }),
      fetchCategories({ limit: 100 }),
      fetchAnimals(),
    ]);

    products = productsData;
    categories = categoriesData;
    animals = animalsData;

    populateCategoryFilter();
    populateAnimalSelect();
    renderTable();
    updateSubtitle();
  } catch (error) {
    showError(
      error instanceof Error ? error.message : "Failed to load products",
    );
  } finally {
    setLoading(false);
  }
}

function getFilteredProducts(): AdminProduct[] {
  let result = products;

  if (categoryFilter) {
    result = result.filter(
      (product) => product.category?.slug === categoryFilter,
    );
  }

  if (searchQuery) {
    result = result.filter((product) => {
      const haystack = `${product.name} ${product.slug} ${product.sku} ${product.category?.name ?? ""}`.toLowerCase();
      return haystack.includes(searchQuery);
    });
  }

  return result;
}

function populateCategoryFilter(): void {
  const select = document.getElementById(
    "category-filter",
  ) as HTMLSelectElement | null;
  if (!select) return;

  const current = select.value;

  select.innerHTML = [
    '<option value="">All categories</option>',
    ...categories.map(
      (category) =>
        `<option value="${escapeHtml(category.slug)}">${escapeHtml(category.name)}</option>`,
    ),
  ].join("");

  select.value =
    current && categories.some((category) => category.slug === current)
      ? current
      : categoryFilter;
}

function populateAnimalSelect(): void {
  const select = document.getElementById(
    "product-animal",
  ) as HTMLSelectElement | null;
  if (!select) return;

  const current = select.value;

  select.innerHTML = [
    '<option value="">Select animal</option>',
    ...animals.map(
      (animal) =>
        `<option value="${animal.id}">${escapeHtml(animal.name)}</option>`,
    ),
  ].join("");

  if (current && animals.some((animal) => String(animal.id) === current)) {
    select.value = current;
  }
}

function getCategoryLabel(category: AdminCategory): string {
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

function populateProductCategorySelect(animalId: number | null): void {
  const select = document.getElementById(
    "product-category",
  ) as HTMLSelectElement | null;
  if (!select) return;

  const filtered = animalId
    ? categories.filter((category) => category.animalId === animalId)
    : [];

  select.innerHTML = [
    '<option value="">Select category</option>',
    ...filtered.map(
      (category) =>
        `<option value="${category.id}">${escapeHtml(getCategoryLabel(category))}</option>`,
    ),
  ].join("");
}

function setProductCategorySelectEnabled(enabled: boolean): void {
  const select = document.getElementById(
    "product-category",
  ) as HTMLSelectElement | null;
  const section = document.getElementById("product-category-section");

  if (select) {
    select.disabled = !enabled;
    select.required = enabled;
    if (!enabled) select.value = "";
  }

  section?.classList.toggle("opacity-50", !enabled);
}

function handleProductAnimalChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  const animalId = value ? Number(value) : null;

  populateProductCategorySelect(animalId);
  setProductCategorySelectEnabled(Boolean(animalId));
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function renderTable(): void {
  const tbody = document.getElementById("products-tbody");
  const emptyState = document.getElementById("products-empty");
  const tableWrap = document.getElementById("products-table-wrap");
  if (!tbody || !emptyState || !tableWrap) return;

  const filtered = getFilteredProducts();

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    tableWrap.classList.add("hidden");
    emptyState.classList.remove("hidden");
    emptyState.querySelector("#products-empty-title")!.textContent =
      products.length === 0
        ? "No products yet"
        : "No products match your filters";
    return;
  }

  tableWrap.classList.remove("hidden");
  emptyState.classList.add("hidden");

  tbody.innerHTML = filtered
    .map((product) => {
      const categoryName = product.category?.name ?? "—";
      const image = product.image
        ? `<img src="${escapeHtml(product.image)}" alt="" class="h-10 w-10 rounded-lg border border-border object-cover" />`
        : `<span class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-light text-xs font-medium text-muted">${escapeHtml(product.name.charAt(0))}</span>`;

      return `
        <tr class="border-b border-border last:border-b-0">
          <td class="px-4 py-3">${image}</td>
          <td class="px-4 py-3">
            <p class="font-medium text-heading">${escapeHtml(product.name)}</p>
            <p class="mt-0.5 text-xs text-muted">${escapeHtml(product.slug)}</p>
          </td>
          <td class="px-4 py-3 font-mono text-xs text-body">${escapeHtml(product.sku)}</td>
          <td class="px-4 py-3">
            <span class="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">${escapeHtml(categoryName)}</span>
          </td>
          <td class="px-4 py-3">
            <p class="font-semibold text-heading">${formatPrice(product.price)}</p>
            ${product.oldPrice ? `<p class="text-xs text-muted line-through">${formatPrice(Number(product.oldPrice))}</p>` : ""}
          </td>
          <td class="px-4 py-3">
            <span class="font-medium text-heading">${Number(product.rating).toFixed(1)}</span>
            <span class="text-xs text-muted"> (${product.reviewCount})</span>
          </td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${product.inStock ? "bg-success/10 text-success" : "bg-sale/10 text-sale"}">
              <span class="h-1.5 w-1.5 rounded-full ${product.inStock ? "bg-success" : "bg-sale"}"></span>
              ${product.inStock ? "In Stock" : "Out of Stock"}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <div class="flex items-center justify-end gap-1">
              <a
                href="/product/${escapeHtml(product.slug)}"
                target="_blank"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-light hover:text-primary"
                aria-label="View ${escapeHtml(product.name)}"
              >↗</a>
              <button
                type="button"
                class="delete-product-btn flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-light hover:text-sale"
                data-id="${product.id}"
                aria-label="Delete ${escapeHtml(product.name)}"
              >×</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll<HTMLButtonElement>(".delete-product-btn").forEach(
    (button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        if (!id) return;
        handleDelete(id);
      });
    },
  );
}

function updateSubtitle(): void {
  const subtitle = document.getElementById("products-subtitle");
  if (!subtitle) return;

  const count = getFilteredProducts().length;
  const total = products.length;
  const inStock = products.filter((product) => product.inStock).length;
  const onSale = products.filter((product) => product.oldPrice).length;

  let label = `${total} products · ${inStock} in stock · ${onSale} on sale`;

  if (categoryFilter || searchQuery) {
    label = `${count} of ${total} products`;
  }

  subtitle.textContent = label;
}

function openModal(): void {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form") as HTMLFormElement | null;
  const slugInput = document.getElementById(
    "product-slug",
  ) as HTMLInputElement | null;

  form?.reset();
  if (slugInput) slugInput.dataset.manual = "false";
  document.getElementById("product-modal-error")?.classList.add("hidden");
  (document.getElementById("product-in-stock") as HTMLInputElement).checked = true;
  populateAnimalSelect();
  populateProductCategorySelect(null);
  setProductCategorySelectEnabled(false);

  modal?.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  (document.getElementById("product-name") as HTMLInputElement | null)?.focus();
}

function closeModal(): void {
  document.getElementById("product-modal")?.classList.add("hidden");
  if (document.getElementById("confirm-dialog")?.classList.contains("hidden")) {
    document.body.classList.remove("overflow-hidden");
  }
}

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const submitBtn = document.getElementById(
    "product-modal-submit-btn",
  ) as HTMLButtonElement | null;

  const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
  const slug = (form.elements.namedItem("slug") as HTMLInputElement).value.trim();
  const sku = (form.elements.namedItem("sku") as HTMLInputElement).value.trim();
  const categoryId = Number(
    (form.elements.namedItem("categoryId") as HTMLSelectElement).value,
  );
  const animalId = Number(
    (document.getElementById("product-animal") as HTMLSelectElement).value,
  );
  const price = Number((form.elements.namedItem("price") as HTMLInputElement).value);
  const oldPriceValue = (
    form.elements.namedItem("oldPrice") as HTMLInputElement
  ).value.trim();
  const description = (
    form.elements.namedItem("description") as HTMLTextAreaElement
  ).value.trim();
  const image = (form.elements.namedItem("image") as HTMLInputElement).value.trim();
  const tagsValue = (form.elements.namedItem("tags") as HTMLInputElement).value.trim();
  const inStock = (form.elements.namedItem("inStock") as HTMLInputElement).checked;

  if (!name || !slug || !sku || !animalId || !categoryId || !description || !image || !price) {
    showModalError("Please fill in all required fields.");
    return;
  }

  submitBtn?.setAttribute("disabled", "true");
  document.getElementById("product-modal-error")?.classList.add("hidden");

  try {
    const created = await createProduct({
      name,
      slug,
      sku,
      description,
      image,
      price,
      categoryId,
      inStock,
      ...(oldPriceValue ? { oldPrice: Number(oldPriceValue) } : {}),
      ...(tagsValue
        ? {
            tags: tagsValue
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          }
        : {}),
    });

    products = [...products, created].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    renderTable();
    updateSubtitle();
    closeModal();
    showToast(`"${created.name}" created`);
  } catch (error) {
    showModalError(
      error instanceof Error ? error.message : "Failed to create product",
    );
  } finally {
    submitBtn?.removeAttribute("disabled");
  }
}

async function handleDelete(id: string): Promise<void> {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  const confirmed = await openConfirmDialog({
    title: "Delete product?",
    message: `"${product.name}" will be permanently removed.`,
    confirmLabel: "Delete",
  });
  if (!confirmed) return;

  try {
    await deleteProduct(id);
    products = products.filter((item) => item.id !== id);
    renderTable();
    updateSubtitle();
    showToast(`"${product.name}" deleted`);
  } catch (error) {
    showError(
      error instanceof Error ? error.message : "Failed to delete product",
    );
  }
}

function bindConfirmDialog(): void {
  document
    .getElementById("confirm-dialog-cancel")
    ?.addEventListener("click", () => closeConfirmDialog(false));
  document
    .getElementById("confirm-dialog-confirm")
    ?.addEventListener("click", () => closeConfirmDialog(true));
  document
    .getElementById("confirm-dialog-backdrop")
    ?.addEventListener("click", () => closeConfirmDialog(false));
}

function openConfirmDialog(options: {
  title: string;
  message: string;
  confirmLabel?: string;
}): Promise<boolean> {
  const dialog = document.getElementById("confirm-dialog");
  const titleEl = document.getElementById("confirm-dialog-title");
  const messageEl = document.getElementById("confirm-dialog-message");
  const confirmBtn = document.getElementById(
    "confirm-dialog-confirm",
  ) as HTMLButtonElement | null;

  if (!dialog || !titleEl || !messageEl) return Promise.resolve(false);

  titleEl.textContent = options.title;
  messageEl.textContent = options.message;
  if (confirmBtn && options.confirmLabel) {
    confirmBtn.textContent = options.confirmLabel;
  }

  dialog.classList.remove("hidden");
  dialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("overflow-hidden");
  confirmBtn?.focus();

  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

function closeConfirmDialog(result: boolean): void {
  const dialog = document.getElementById("confirm-dialog");
  if (!dialog || dialog.classList.contains("hidden")) return;

  dialog.classList.add("hidden");
  dialog.setAttribute("aria-hidden", "true");

  if (document.getElementById("product-modal")?.classList.contains("hidden")) {
    document.body.classList.remove("overflow-hidden");
  }

  const resolve = confirmResolve;
  confirmResolve = null;
  resolve?.(result);
}

function showToast(message: string): void {
  const toast = document.getElementById("admin-toast");
  const messageEl = document.getElementById("admin-toast-message");
  if (!toast || !messageEl) return;

  messageEl.textContent = message;
  toast.classList.remove("opacity-0", "translate-y-2");
  toast.classList.add("opacity-100", "translate-y-0");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    toast.classList.remove("opacity-100", "translate-y-0");
  }, 3000);
}

function setLoading(isLoading: boolean): void {
  document
    .getElementById("products-loading")
    ?.classList.toggle("hidden", !isLoading);
  document
    .getElementById("products-content")
    ?.classList.toggle("hidden", isLoading);
}

function showError(message: string): void {
  const errorEl = document.getElementById("products-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function hideError(): void {
  document.getElementById("products-error")?.classList.add("hidden");
}

function showModalError(message: string): void {
  const errorEl = document.getElementById("product-modal-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
