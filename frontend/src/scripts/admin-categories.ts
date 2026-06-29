import {
  createCategory,
  deleteCategory,
  fetchAnimals,
  fetchCategories,
  slugify,
} from "../lib/admin/categories";
import type { Animal, AdminCategory } from "../types";

let animals: Animal[] = [];
let categories: AdminCategory[] = [];
let activeAnimalId: number | null = null;

export function initCategoriesPage(): void {
  const page = document.getElementById("categories-page");
  if (!page) return;

  bindEvents();
  loadData();
}

function bindEvents(): void {
  document
    .getElementById("add-category-btn")
    ?.addEventListener("click", openModal);

  document
    .getElementById("modal-close-btn")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("modal-cancel-btn")
    ?.addEventListener("click", closeModal);

  document
    .getElementById("category-modal-backdrop")
    ?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeModal();
    });

  document
    .getElementById("category-form")
    ?.addEventListener("submit", handleSubmit);

  document.getElementById("category-name")?.addEventListener("input", (event) => {
    const slugInput = document.getElementById(
      "category-slug",
    ) as HTMLInputElement | null;
    const nameInput = event.target as HTMLInputElement;
    if (!slugInput || slugInput.dataset.manual === "true") return;
    slugInput.value = slugify(nameInput.value);
  });

  document.getElementById("category-slug")?.addEventListener("input", (event) => {
    const slugInput = event.target as HTMLInputElement;
    slugInput.dataset.manual = slugInput.value ? "true" : "false";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

async function loadData(): Promise<void> {
  setLoading(true);
  hideError();

  try {
    const [animalsData, categoriesData] = await Promise.all([
      fetchAnimals(),
      fetchCategories({ limit: 100 }),
    ]);

    animals = animalsData;
    categories = categoriesData;

    renderAnimalFilters();
    renderTable();
    populateAnimalSelect();
    updateSubtitle();
  } catch (error) {
    showError(
      error instanceof Error ? error.message : "Failed to load categories",
    );
  } finally {
    setLoading(false);
  }
}

function getFilteredCategories(): AdminCategory[] {
  if (activeAnimalId === null) return categories;
  return categories.filter((category) => category.animalId === activeAnimalId);
}

function renderAnimalFilters(): void {
  const container = document.getElementById("animal-filters");
  if (!container) return;

  const pills = [
    `<button type="button" data-animal-id="" class="filter-pill${activeAnimalId === null ? " is-active" : ""}">All</button>`,
    ...animals.map(
      (animal) =>
        `<button type="button" data-animal-id="${animal.id}" class="filter-pill${activeAnimalId === animal.id ? " is-active" : ""}">${escapeHtml(animal.name)}</button>`,
    ),
  ];

  container.innerHTML = pills.join("");

  container.querySelectorAll<HTMLButtonElement>("[data-animal-id]").forEach(
    (button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.animalId;
        activeAnimalId = value ? Number(value) : null;
        renderAnimalFilters();
        renderTable();
        updateSubtitle();
      });
    },
  );
}

function renderTable(): void {
  const tbody = document.getElementById("categories-tbody");
  const emptyState = document.getElementById("categories-empty");
  const tableWrap = document.getElementById("categories-table-wrap");
  if (!tbody || !emptyState || !tableWrap) return;

  const filtered = getFilteredCategories();

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    tableWrap.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  tableWrap.classList.remove("hidden");
  emptyState.classList.add("hidden");

  tbody.innerHTML = filtered
    .map((category) => {
      const productCount = category._count?.products ?? 0;
      const animalName = category.animal?.name ?? "—";
      const image = category.image
        ? `<img src="${escapeHtml(category.image)}" alt="" class="h-10 w-10 rounded-lg border border-border object-cover" />`
        : `<span class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-light text-xs font-medium text-muted">${escapeHtml(category.name.charAt(0))}</span>`;

      return `
        <tr class="border-b border-border last:border-b-0">
          <td class="px-4 py-3">${image}</td>
          <td class="px-4 py-3">
            <p class="font-medium text-heading">${escapeHtml(category.name)}</p>
            ${category.description ? `<p class="mt-0.5 text-xs text-muted line-clamp-1">${escapeHtml(category.description)}</p>` : ""}
          </td>
          <td class="px-4 py-3">
            <code class="rounded bg-light px-2 py-1 text-xs text-body">/${escapeHtml(category.slug)}</code>
          </td>
          <td class="px-4 py-3 text-sm text-body">${escapeHtml(animalName)}</td>
          <td class="px-4 py-3 text-sm text-body">${productCount}</td>
          <td class="px-4 py-3 text-right">
            <button
              type="button"
              class="delete-category-btn text-sm font-medium text-sale transition-colors hover:text-sale/80 disabled:cursor-not-allowed disabled:opacity-40"
              data-id="${category.id}"
              ${productCount > 0 ? "disabled title=\"Remove products before deleting\"" : ""}
            >
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll<HTMLButtonElement>(".delete-category-btn").forEach(
    (button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.id);
        if (!id || button.disabled) return;
        handleDelete(id);
      });
    },
  );
}

function populateAnimalSelect(): void {
  const select = document.getElementById(
    "category-animal",
  ) as HTMLSelectElement | null;
  if (!select) return;

  select.innerHTML = [
    '<option value="">Select animal type</option>',
    ...animals.map(
      (animal) =>
        `<option value="${animal.id}">${escapeHtml(animal.name)}</option>`,
    ),
  ].join("");
}

function updateSubtitle(): void {
  const subtitle = document.getElementById("categories-subtitle");
  if (!subtitle) return;

  const count = getFilteredCategories().length;
  const label =
    activeAnimalId === null
      ? `${count} categories across ${animals.length} animal types`
      : `${count} categories for ${animals.find((a) => a.id === activeAnimalId)?.name ?? "selected animal"}`;

  subtitle.textContent = label;
}

function openModal(): void {
  if (animals.length === 0) {
    showError("Add animal types before creating categories.");
    return;
  }

  const modal = document.getElementById("category-modal");
  const form = document.getElementById("category-form") as HTMLFormElement | null;
  const errorEl = document.getElementById("modal-error");
  const slugInput = document.getElementById(
    "category-slug",
  ) as HTMLInputElement | null;

  form?.reset();
  if (slugInput) slugInput.dataset.manual = "false";
  errorEl?.classList.add("hidden");

  if (activeAnimalId !== null) {
    const animalSelect = document.getElementById(
      "category-animal",
    ) as HTMLSelectElement | null;
    if (animalSelect) animalSelect.value = String(activeAnimalId);
  }

  modal?.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  (
    document.getElementById("category-name") as HTMLInputElement | null
  )?.focus();
}

function closeModal(): void {
  document.getElementById("category-modal")?.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const submitBtn = document.getElementById(
    "modal-submit-btn",
  ) as HTMLButtonElement | null;
  const errorEl = document.getElementById("modal-error");

  const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
  const slug = (form.elements.namedItem("slug") as HTMLInputElement).value.trim();
  const description = (
    form.elements.namedItem("description") as HTMLTextAreaElement
  ).value.trim();
  const image = (form.elements.namedItem("image") as HTMLInputElement).value.trim();
  const animalId = Number(
    (form.elements.namedItem("animalId") as HTMLSelectElement).value,
  );

  if (!name || !slug || !animalId) {
    showModalError("Name, slug, and animal type are required.");
    return;
  }

  submitBtn?.setAttribute("disabled", "true");
  errorEl?.classList.add("hidden");

  try {
    const created = await createCategory({
      name,
      slug,
      animalId,
      ...(description ? { description } : {}),
      ...(image ? { image } : {}),
    });

    categories = [...categories, created].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    renderTable();
    updateSubtitle();
    closeModal();
  } catch (error) {
    showModalError(
      error instanceof Error ? error.message : "Failed to create category",
    );
  } finally {
    submitBtn?.removeAttribute("disabled");
  }
}

async function handleDelete(id: number): Promise<void> {
  const category = categories.find((item) => item.id === id);
  if (!category) return;

  const confirmed = window.confirm(
    `Delete "${category.name}"? This action cannot be undone.`,
  );
  if (!confirmed) return;

  try {
    await deleteCategory(id);
    categories = categories.filter((item) => item.id !== id);
    renderTable();
    updateSubtitle();
  } catch (error) {
    showError(
      error instanceof Error ? error.message : "Failed to delete category",
    );
  }
}

function setLoading(isLoading: boolean): void {
  document
    .getElementById("categories-loading")
    ?.classList.toggle("hidden", !isLoading);
  document
    .getElementById("categories-content")
    ?.classList.toggle("hidden", isLoading);
}

function showError(message: string): void {
  const errorEl = document.getElementById("categories-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function hideError(): void {
  document.getElementById("categories-error")?.classList.add("hidden");
}

function showModalError(message: string): void {
  const errorEl = document.getElementById("modal-error");
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
