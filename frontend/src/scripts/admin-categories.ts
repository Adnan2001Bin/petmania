import {
  createAnimal,
  createCategory,
  deleteCategory,
  fetchAnimals,
  fetchCategories,
  slugify,
} from "../lib/admin/categories";
import type { Animal, AdminCategory } from "../types";

const NEW_ANIMAL_VALUE = "__new__";

let animals: Animal[] = [];
let categories: AdminCategory[] = [];
let activeAnimalId: number | null = null;
let searchQuery = "";

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

  document.getElementById("new-animal-name")?.addEventListener("input", (event) => {
    const slugInput = document.getElementById(
      "new-animal-slug",
    ) as HTMLInputElement | null;
    const nameInput = event.target as HTMLInputElement;
    if (!slugInput || slugInput.dataset.manual === "true") return;
    slugInput.value = slugify(nameInput.value);
  });

  document.getElementById("new-animal-slug")?.addEventListener("input", (event) => {
    const slugInput = event.target as HTMLInputElement;
    slugInput.dataset.manual = slugInput.value ? "true" : "false";
  });

  document
    .getElementById("animal-filter")
    ?.addEventListener("change", (event) => {
      const value = (event.target as HTMLSelectElement).value;
      activeAnimalId = value ? Number(value) : null;
      renderTable();
      updateSubtitle();
    });

  document
    .getElementById("category-search")
    ?.addEventListener("input", (event) => {
      searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
      renderTable();
      updateSubtitle();
    });

  document
    .getElementById("category-animal")
    ?.addEventListener("change", handleAnimalSelectChange);

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

    populateAnimalFilter();
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
  let result = categories;

  if (activeAnimalId !== null) {
    result = result.filter((category) => category.animalId === activeAnimalId);
  }

  if (searchQuery) {
    result = result.filter((category) => {
      const haystack = `${category.name} ${category.slug} ${category.animal?.name ?? ""}`.toLowerCase();
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
      : activeAnimalId !== null
        ? String(activeAnimalId)
        : "";
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
    emptyState.querySelector("#categories-empty-title")!.textContent =
      categories.length === 0
        ? "No categories yet"
        : "No categories match your filters";
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
    `<option value="${NEW_ANIMAL_VALUE}">+ Add new animal type</option>`,
  ].join("");
}

function handleAnimalSelectChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  toggleNewAnimalPanel(value === NEW_ANIMAL_VALUE);
}

function toggleNewAnimalPanel(show: boolean): void {
  const panel = document.getElementById("new-animal-panel");
  const animalSelect = document.getElementById(
    "category-animal",
  ) as HTMLSelectElement | null;

  panel?.classList.toggle("hidden", !show);

  if (animalSelect) {
    animalSelect.required = !show;
  }

  if (!show) {
    clearNewAnimalFields();
  }
}

function clearNewAnimalFields(): void {
  const nameInput = document.getElementById(
    "new-animal-name",
  ) as HTMLInputElement | null;
  const slugInput = document.getElementById(
    "new-animal-slug",
  ) as HTMLInputElement | null;
  const descriptionInput = document.getElementById(
    "new-animal-description",
  ) as HTMLTextAreaElement | null;
  const imageInput = document.getElementById(
    "new-animal-image",
  ) as HTMLInputElement | null;

  if (nameInput) nameInput.value = "";
  if (slugInput) {
    slugInput.value = "";
    slugInput.dataset.manual = "false";
  }
  if (descriptionInput) descriptionInput.value = "";
  if (imageInput) imageInput.value = "";
}

function updateSubtitle(): void {
  const subtitle = document.getElementById("categories-subtitle");
  if (!subtitle) return;

  const count = getFilteredCategories().length;
  const total = categories.length;
  const animalName = animals.find((a) => a.id === activeAnimalId)?.name;

  let label = `${total} categories across ${animals.length} animal types`;

  if (activeAnimalId !== null && animalName) {
    label = searchQuery
      ? `${count} of ${total} categories for ${animalName}`
      : `${count} categories for ${animalName}`;
  } else if (searchQuery) {
    label = `${count} of ${total} categories`;
  }

  subtitle.textContent = label;
}

function openModal(): void {
  const modal = document.getElementById("category-modal");
  const form = document.getElementById("category-form") as HTMLFormElement | null;
  const errorEl = document.getElementById("modal-error");
  const slugInput = document.getElementById(
    "category-slug",
  ) as HTMLInputElement | null;
  const animalSelect = document.getElementById(
    "category-animal",
  ) as HTMLSelectElement | null;

  form?.reset();
  if (slugInput) slugInput.dataset.manual = "false";
  errorEl?.classList.add("hidden");
  clearNewAnimalFields();
  populateAnimalSelect();

  if (animals.length === 0) {
    if (animalSelect) animalSelect.value = NEW_ANIMAL_VALUE;
    toggleNewAnimalPanel(true);
  } else if (activeAnimalId !== null && animalSelect) {
    animalSelect.value = String(activeAnimalId);
    toggleNewAnimalPanel(false);
  } else {
    toggleNewAnimalPanel(false);
  }

  modal?.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  (
    document.getElementById("category-name") as HTMLInputElement | null
  )?.focus();
}

function closeModal(): void {
  toggleNewAnimalPanel(false);
  document.getElementById("category-modal")?.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

async function resolveAnimalId(
  animalSelectValue: string,
): Promise<number> {
  if (animalSelectValue !== NEW_ANIMAL_VALUE) {
    return Number(animalSelectValue);
  }

  const name = (
    document.getElementById("new-animal-name") as HTMLInputElement
  ).value.trim();
  const slug = (
    document.getElementById("new-animal-slug") as HTMLInputElement
  ).value.trim();
  const description = (
    document.getElementById("new-animal-description") as HTMLTextAreaElement
  ).value.trim();
  const image = (
    document.getElementById("new-animal-image") as HTMLInputElement
  ).value.trim();

  if (!name || !slug) {
    throw new Error("Animal name and slug are required.");
  }

  const created = await createAnimal({
    name,
    slug,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
  });

  animals = [...animals, created].sort((a, b) => a.name.localeCompare(b.name));
  populateAnimalFilter();
  populateAnimalSelect();

  return created.id;
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
  const animalSelectValue = (
    form.elements.namedItem("animalId") as HTMLSelectElement
  ).value;

  if (!name || !slug || !animalSelectValue) {
    showModalError("Name, slug, and animal type are required.");
    return;
  }

  submitBtn?.setAttribute("disabled", "true");
  errorEl?.classList.add("hidden");

  try {
    const animalId = await resolveAnimalId(animalSelectValue);

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
