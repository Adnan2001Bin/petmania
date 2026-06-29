import {
  buildCategoryFromAnimal,
  createAnimal,
  createCategory,
  deleteCategory,
  fetchAnimals,
  fetchCategories,
  slugify,
} from "../lib/admin/categories";
import type { Animal, AdminCategory } from "../types";

const NEW_ANIMAL_VALUE = "__new__";
const NEW_CATEGORY_TYPE_VALUE = "__new_type__";

const DEFAULT_CATEGORY_TYPES = [
  "Food",
  "Toys",
  "Grooming",
  "Accessories",
  "Treats",
  "Beds",
];

let animals: Animal[] = [];
let categories: AdminCategory[] = [];
let customCategoryTypes: string[] = [];
let activeAnimalId: number | null = null;
let searchQuery = "";
let confirmResolve: ((value: boolean) => void) | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

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

  document
    .getElementById("category-type")
    ?.addEventListener("change", handleCategoryTypeChange);

  document
    .getElementById("new-category-type-name")
    ?.addEventListener("input", updateCategoryPreview);

  document
    .getElementById("new-category-type-cancel-btn")
    ?.addEventListener("click", hideNewCategoryTypePanel);

  document
    .getElementById("new-animal-cancel-btn")
    ?.addEventListener("click", hideNewAnimalPanel);

  document
    .getElementById("new-animal-add-btn")
    ?.addEventListener("click", handleAddAnimal);

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
    const [animalsData, categoriesData] = await Promise.all([
      fetchAnimals(),
      fetchCategories({ limit: 100 }),
    ]);

    animals = animalsData;
    categories = categoriesData;

    populateAnimalFilter();
    renderTable();
    populateAnimalSelect();
    populateCategoryTypeSelect();
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
    '<option value="">Select animal</option>',
    ...animals.map(
      (animal) =>
        `<option value="${animal.id}">${escapeHtml(animal.name)}</option>`,
    ),
    `<option value="${NEW_ANIMAL_VALUE}">+ Add new</option>`,
  ].join("");
}

function populateCategoryTypeSelect(): void {
  const select = document.getElementById(
    "category-type",
  ) as HTMLSelectElement | null;
  if (!select) return;

  const current = select.value;
  const allTypes = [
    ...DEFAULT_CATEGORY_TYPES,
    ...customCategoryTypes.filter(
      (type) => !DEFAULT_CATEGORY_TYPES.includes(type),
    ),
  ];

  select.innerHTML = [
    '<option value="">Select type</option>',
    ...allTypes.map(
      (type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`,
    ),
    `<option value="${NEW_CATEGORY_TYPE_VALUE}">+ Add new</option>`,
  ].join("");

  if (current && allTypes.includes(current)) {
    select.value = current;
  } else if (current === NEW_CATEGORY_TYPE_VALUE) {
    select.value = NEW_CATEGORY_TYPE_VALUE;
  }
}

function getSelectedAnimal(): Animal | null {
  const select = document.getElementById(
    "category-animal",
  ) as HTMLSelectElement | null;
  if (!select?.value || select.value === NEW_ANIMAL_VALUE) return null;

  const id = Number(select.value);
  return animals.find((animal) => animal.id === id) ?? null;
}

function getCategoryTypeLabel(): string | null {
  const select = document.getElementById(
    "category-type",
  ) as HTMLSelectElement | null;
  if (!select?.value) return null;

  if (select.value === NEW_CATEGORY_TYPE_VALUE) {
    return (
      document.getElementById("new-category-type-name") as HTMLInputElement
    ).value.trim() || null;
  }

  return select.value;
}

function updateCategoryPreview(): void {
  const preview = document.getElementById("category-preview");
  const animal = getSelectedAnimal();
  const typeLabel = getCategoryTypeLabel();

  if (!preview) return;

  if (!animal || !typeLabel) {
    preview.classList.add("hidden");
    preview.textContent = "";
    return;
  }

  const { name } = buildCategoryFromAnimal(animal, typeLabel);
  preview.classList.remove("hidden");
  preview.textContent = name;
}

function setCategoryTypeSectionEnabled(enabled: boolean): void {
  const typeSelect = document.getElementById(
    "category-type",
  ) as HTMLSelectElement | null;
  const section = document.getElementById("category-type-section");

  if (typeSelect) {
    typeSelect.disabled = !enabled;
    typeSelect.required = enabled;
  }

  section?.classList.toggle("opacity-50", !enabled);

  if (!enabled) {
    if (typeSelect) typeSelect.value = "";
    hideNewCategoryTypePanel();
    updateCategoryPreview();
  }
}

function handleCategoryTypeChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  toggleNewCategoryTypePanel(value === NEW_CATEGORY_TYPE_VALUE);
  updateCategoryPreview();
}

function hideNewCategoryTypePanel(): void {
  const typeSelect = document.getElementById(
    "category-type",
  ) as HTMLSelectElement | null;

  if (typeSelect) {
    typeSelect.value = "";
  }

  toggleNewCategoryTypePanel(false);
}

function toggleNewCategoryTypePanel(show: boolean): void {
  const panel = document.getElementById("new-category-type-panel");

  panel?.classList.toggle("hidden", !show);

  if (!show) {
    clearNewCategoryTypeFields();
  } else {
    (
      document.getElementById("new-category-type-name") as HTMLInputElement | null
    )?.focus();
  }
}

function clearNewCategoryTypeFields(): void {
  const nameInput = document.getElementById(
    "new-category-type-name",
  ) as HTMLInputElement | null;

  if (nameInput) nameInput.value = "";
}

function handleAnimalSelectChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  const isNewAnimal = value === NEW_ANIMAL_VALUE;

  toggleNewAnimalPanel(isNewAnimal);
  setCategoryTypeSectionEnabled(!isNewAnimal && Boolean(value));
  updateCategoryPreview();
}

function getNewAnimalFormValues(): {
  name: string;
  slug: string;
  image: string;
} {
  return {
    name: (
      document.getElementById("new-animal-name") as HTMLInputElement
    ).value.trim(),
    slug: (
      document.getElementById("new-animal-slug") as HTMLInputElement
    ).value.trim(),
    image: (
      document.getElementById("new-animal-image") as HTMLInputElement
    ).value.trim(),
  };
}

function showNewAnimalError(message: string): void {
  const errorEl = document.getElementById("new-animal-error");
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function hideNewAnimalError(): void {
  document.getElementById("new-animal-error")?.classList.add("hidden");
}

function registerAnimal(animal: Animal): void {
  animals = [...animals, animal].sort((a, b) => a.name.localeCompare(b.name));
  populateAnimalFilter();
  populateAnimalSelect();

  const animalSelect = document.getElementById(
    "category-animal",
  ) as HTMLSelectElement | null;
  if (animalSelect) {
    animalSelect.value = String(animal.id);
  }

  toggleNewAnimalPanel(false);
  setCategoryTypeSectionEnabled(true);
  updateCategoryPreview();
  updateSubtitle();
}

async function handleAddAnimal(): Promise<void> {
  const addBtn = document.getElementById(
    "new-animal-add-btn",
  ) as HTMLButtonElement | null;
  const { name, slug, image } = getNewAnimalFormValues();

  hideNewAnimalError();
  document.getElementById("modal-error")?.classList.add("hidden");

  if (!name || !slug) {
    showNewAnimalError("Name and slug are required.");
    return;
  }

  addBtn?.setAttribute("disabled", "true");

  try {
    const created = await createAnimal({
      name,
      slug,
      ...(image ? { image } : {}),
    });

    registerAnimal(created);
  } catch (error) {
    showNewAnimalError(
      error instanceof Error ? error.message : "Failed to add animal",
    );
  } finally {
    addBtn?.removeAttribute("disabled");
  }
}

function hideNewAnimalPanel(): void {
  const animalSelect = document.getElementById(
    "category-animal",
  ) as HTMLSelectElement | null;

  if (animalSelect) {
    animalSelect.value = "";
  }

  toggleNewAnimalPanel(false);
  setCategoryTypeSectionEnabled(false);
  updateCategoryPreview();
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
    hideNewAnimalError();
  }
}

function clearNewAnimalFields(): void {
  const nameInput = document.getElementById(
    "new-animal-name",
  ) as HTMLInputElement | null;
  const slugInput = document.getElementById(
    "new-animal-slug",
  ) as HTMLInputElement | null;
  const imageInput = document.getElementById(
    "new-animal-image",
  ) as HTMLInputElement | null;

  if (nameInput) nameInput.value = "";
  if (slugInput) {
    slugInput.value = "";
    slugInput.dataset.manual = "false";
  }
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
  const animalSelect = document.getElementById(
    "category-animal",
  ) as HTMLSelectElement | null;

  form?.reset();
  errorEl?.classList.add("hidden");
  clearNewAnimalFields();
  clearNewCategoryTypeFields();
  populateAnimalSelect();
  populateCategoryTypeSelect();
  hideNewCategoryTypePanel();

  if (animals.length === 0) {
    if (animalSelect) animalSelect.value = NEW_ANIMAL_VALUE;
    toggleNewAnimalPanel(true);
    setCategoryTypeSectionEnabled(false);
  } else if (activeAnimalId !== null && animalSelect) {
    animalSelect.value = String(activeAnimalId);
    toggleNewAnimalPanel(false);
    setCategoryTypeSectionEnabled(true);
  } else {
    toggleNewAnimalPanel(false);
    setCategoryTypeSectionEnabled(false);
  }

  updateCategoryPreview();
  modal?.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  animalSelect?.focus();
}

function closeModal(): void {
  toggleNewAnimalPanel(false);
  hideNewCategoryTypePanel();
  document.getElementById("category-modal")?.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

async function resolveAnimalId(
  animalSelectValue: string,
): Promise<number> {
  if (animalSelectValue === NEW_ANIMAL_VALUE) {
    throw new Error("Add the animal using the Add Animal button first.");
  }

  return Number(animalSelectValue);
}

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const submitBtn = document.getElementById(
    "modal-submit-btn",
  ) as HTMLButtonElement | null;
  const errorEl = document.getElementById("modal-error");

  const description = (
    form.elements.namedItem("description") as HTMLTextAreaElement
  ).value.trim();
  const image = (form.elements.namedItem("image") as HTMLInputElement).value.trim();
  const animalSelectValue = (
    form.elements.namedItem("animalId") as HTMLSelectElement
  ).value;

  const animal = getSelectedAnimal();
  const typeLabel = getCategoryTypeLabel();

  if (!animalSelectValue || animalSelectValue === NEW_ANIMAL_VALUE) {
    showModalError("Select an animal first.");
    return;
  }

  if (!typeLabel) {
    showModalError("Select a category type.");
    return;
  }

  const { name, slug } = buildCategoryFromAnimal(animal!, typeLabel);

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

    if (
      !DEFAULT_CATEGORY_TYPES.includes(typeLabel) &&
      !customCategoryTypes.includes(typeLabel)
    ) {
      customCategoryTypes = [...customCategoryTypes, typeLabel].sort((a, b) =>
        a.localeCompare(b),
      );
      populateCategoryTypeSelect();
    }

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

  const confirmed = await openConfirmDialog({
    title: "Delete category?",
    message: `"${category.name}" will be permanently removed.`,
    confirmLabel: "Delete",
  });
  if (!confirmed) return;

  try {
    await deleteCategory(id);
    categories = categories.filter((item) => item.id !== id);
    renderTable();
    updateSubtitle();
    showToast(`"${category.name}" deleted`);
  } catch (error) {
    showError(
      error instanceof Error ? error.message : "Failed to delete category",
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

  if (!dialog || !titleEl || !messageEl) {
    return Promise.resolve(false);
  }

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

  if (document.getElementById("category-modal")?.classList.contains("hidden")) {
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
