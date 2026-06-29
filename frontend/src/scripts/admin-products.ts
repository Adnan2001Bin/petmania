import {
  createProduct,
  deleteProduct,
  fetchProducts,
  slugify,
  updateProduct,
} from "../lib/admin/products";
import { fetchCategories, fetchAnimals } from "../lib/admin/categories";
import type { AdminCategory, AdminProduct, Animal } from "../types";

let products: AdminProduct[] = [];
let categories: AdminCategory[] = [];
let animals: Animal[] = [];
let searchQuery = "";
let animalFilter: number | null = null;
let categoryFilter = "";
let stockFilter = "";
let editingProductId: string | null = null;
let confirmResolve: ((value: boolean) => void) | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const ACTION_ICONS = {
  view: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>`,
  delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
};

export function initProductsPage(): void {
  const page = document.getElementById("products-page");
  if (!page) return;

  bindEvents();
  loadData();
}

function bindEvents(): void {
  document.getElementById("add-product-btn")?.addEventListener("click", () => openModal());
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

  document.getElementById("animal-filter")?.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    animalFilter = value ? Number(value) : null;
    categoryFilter = "";
    populateFilterCategorySelect(animalFilter);
    setFilterCategoryEnabled(Boolean(animalFilter));
    renderTable();
    updateSubtitle();
  });

  document.getElementById("category-filter")?.addEventListener("change", (event) => {
    categoryFilter = (event.target as HTMLSelectElement).value;
    renderTable();
    updateSubtitle();
  });

  document.getElementById("stock-filter")?.addEventListener("change", (event) => {
    stockFilter = (event.target as HTMLSelectElement).value;
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

    populateAnimalFilter();
    populateFilterCategorySelect(animalFilter);
    setFilterCategoryEnabled(Boolean(animalFilter));
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

  if (animalFilter !== null) {
    result = result.filter((product) => {
      const category = categories.find((item) => item.id === product.categoryId);
      return category?.animalId === animalFilter;
    });
  }

  if (categoryFilter) {
    result = result.filter(
      (product) => product.category?.slug === categoryFilter,
    );
  }

  if (stockFilter === "in") {
    result = result.filter((product) => product.inStock);
  } else if (stockFilter === "out") {
    result = result.filter((product) => !product.inStock);
  }

  if (searchQuery) {
    result = result.filter((product) => {
      const haystack = `${product.name} ${product.slug} ${product.sku} ${product.category?.name ?? ""}`.toLowerCase();
      return haystack.includes(searchQuery);
    });
  }

  return result;
}

function populateAnimalFilter(): void {
  const select = document.getElementById(
    "animal-filter",
  ) as HTMLSelectElement | null;
  if (!select) return;

  const current = select.value;

  select.innerHTML = [
    '<option value="">All animals</option>',
    ...animals.map(
      (animal) =>
        `<option value="${animal.id}">${escapeHtml(animal.name)}</option>`,
    ),
  ].join("");

  select.value =
    current && animals.some((animal) => String(animal.id) === current)
      ? current
      : animalFilter !== null
        ? String(animalFilter)
        : "";
}

function populateFilterCategorySelect(animalId: number | null): void {
  const select = document.getElementById(
    "category-filter",
  ) as HTMLSelectElement | null;
  if (!select) return;

  const filtered = animalId
    ? categories.filter((category) => category.animalId === animalId)
    : [];

  select.innerHTML = [
    '<option value="">All categories</option>',
    ...filtered.map(
      (category) =>
        `<option value="${escapeHtml(category.slug)}">${escapeHtml(getCategoryLabel(category))}</option>`,
    ),
  ].join("");
}

function setFilterCategoryEnabled(enabled: boolean): void {
  const select = document.getElementById(
    "category-filter",
  ) as HTMLSelectElement | null;
  const section = document.getElementById("filter-category-section");

  if (select) {
    select.disabled = !enabled;
    if (!enabled) select.value = "";
  }

  section?.classList.toggle("opacity-50", !enabled);
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
                rel="noopener noreferrer"
                data-tip="View"
                aria-label="View ${escapeHtml(product.name)}"
                class="admin-tip flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-light hover:text-primary"
              >${ACTION_ICONS.view}</a>
              <button
                type="button"
                class="edit-product-btn admin-tip flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-light hover:text-accent"
                data-id="${product.id}"
                data-tip="Edit"
                aria-label="Edit ${escapeHtml(product.name)}"
              >${ACTION_ICONS.edit}</button>
              <button
                type="button"
                class="delete-product-btn admin-tip flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-light hover:text-sale"
                data-id="${product.id}"
                data-tip="Delete"
                aria-label="Delete ${escapeHtml(product.name)}"
              >${ACTION_ICONS.delete}</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll<HTMLButtonElement>(".edit-product-btn").forEach(
    (button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        if (!id) return;
        openEditModal(id);
      });
    },
  );

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

  if (animalFilter !== null || categoryFilter || stockFilter || searchQuery) {
    label = `${count} of ${total} products`;
  }

  subtitle.textContent = label;
}

function setModalMode(mode: "create" | "edit"): void {
  const title = document.getElementById("product-modal-title");
  const submitBtn = document.getElementById("product-modal-submit-btn");

  if (title) {
    title.textContent = mode === "edit" ? "Edit Product" : "Add Product";
  }
  if (submitBtn) {
    submitBtn.textContent = mode === "edit" ? "Save Changes" : "Create Product";
  }
}

function openModal(): void {
  editingProductId = null;
  setModalMode("create");

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

function openEditModal(id: string): void {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  const category = categories.find((item) => item.id === product.categoryId);
  const animalId = category?.animalId ?? null;

  editingProductId = id;
  setModalMode("edit");

  const modal = document.getElementById("product-modal");
  const slugInput = document.getElementById(
    "product-slug",
  ) as HTMLInputElement | null;

  document.getElementById("product-modal-error")?.classList.add("hidden");

  (document.getElementById("product-name") as HTMLInputElement).value =
    product.name;
  if (slugInput) {
    slugInput.value = product.slug;
    slugInput.dataset.manual = "true";
  }
  (document.getElementById("product-sku") as HTMLInputElement).value =
    product.sku;
  (document.getElementById("product-price") as HTMLInputElement).value =
    String(product.price);
  (document.getElementById("product-old-price") as HTMLInputElement).value =
    product.oldPrice != null ? String(product.oldPrice) : "";
  (document.getElementById("product-description") as HTMLTextAreaElement).value =
    product.description;
  (document.getElementById("product-image") as HTMLInputElement).value =
    product.image;
  (document.getElementById("product-tags") as HTMLInputElement).value =
    product.tags?.map((item) => item.tag.name).join(", ") ?? "";
  (document.getElementById("product-in-stock") as HTMLInputElement).checked =
    product.inStock;

  populateAnimalSelect();
  if (animalId) {
    (document.getElementById("product-animal") as HTMLSelectElement).value =
      String(animalId);
    populateProductCategorySelect(animalId);
    setProductCategorySelectEnabled(true);
    (document.getElementById("product-category") as HTMLSelectElement).value =
      String(product.categoryId);
  } else {
    populateProductCategorySelect(null);
    setProductCategorySelectEnabled(false);
  }

  modal?.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  (document.getElementById("product-name") as HTMLInputElement).focus();
}

function closeModal(): void {
  editingProductId = null;
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

  const payload = {
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
      : { tags: [] }),
  };

  try {
    if (editingProductId) {
      const previous = products.find((item) => item.id === editingProductId);
      const updated = await updateProduct(editingProductId, payload);
      const merged = {
        ...updated,
        tags: updated.tags ?? previous?.tags,
      };
      products = products
        .map((item) => (item.id === merged.id ? merged : item))
        .sort((a, b) => a.name.localeCompare(b.name));
      renderTable();
      updateSubtitle();
      closeModal();
      showToast(`"${merged.name}" updated`);
    } else {
      const created = await createProduct(payload);
      products = [...products, created].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      renderTable();
      updateSubtitle();
      closeModal();
      showToast(`"${created.name}" created`);
    }
  } catch (error) {
    showModalError(
      error instanceof Error
        ? error.message
        : editingProductId
          ? "Failed to update product"
          : "Failed to create product",
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
