import {
  fetchPublicCategories,
  renderShopCategoryItem,
} from "../lib/categories";

export async function initShopCategories(): Promise<void> {
  const list = document.getElementById("shop-category-list");
  if (!list) return;

  try {
    const categories = await fetchPublicCategories();

    if (categories.length === 0) {
      list.innerHTML = `
        <li class="px-3 py-2 text-sm text-muted">No categories available yet.</li>
      `;
      return;
    }

    list.innerHTML = categories.map(renderShopCategoryItem).join("");
  } catch {
    list.innerHTML = `
      <li class="px-3 py-2 text-sm text-muted">Unable to load categories.</li>
    `;
  }
}
