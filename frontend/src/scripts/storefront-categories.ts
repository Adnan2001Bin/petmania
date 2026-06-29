import {
  fetchPublicCategories,
  renderCategoryCard,
  toStorefrontCategory,
} from "../lib/categories";
import Swiper from "swiper";
import { Navigation } from "swiper/modules";
import "swiper/css";

let swiperInstance: Swiper | null = null;

export async function initCategorySlider(): Promise<void> {
  const wrapper = document.getElementById("category-slider-wrapper");
  if (!wrapper) return;

  try {
    const categories = await fetchPublicCategories();
    const storefrontCategories = categories.map(toStorefrontCategory);

    if (storefrontCategories.length === 0) {
      wrapper.innerHTML = `
        <div class="swiper-slide">
          <p class="py-8 text-center text-sm text-muted">No categories available yet.</p>
        </div>
      `;
      return;
    }

    wrapper.innerHTML = storefrontCategories
      .map(
        (category) => `
          <div class="swiper-slide">
            ${renderCategoryCard(category)}
          </div>
        `,
      )
      .join("");

    swiperInstance?.destroy(true, true);
    swiperInstance = new Swiper(".category-slider", {
      modules: [Navigation],
      slidesPerView: 2,
      spaceBetween: 20,
      navigation: {
        nextEl: ".category-next",
        prevEl: ".category-prev",
      },
      breakpoints: {
        640: { slidesPerView: 3 },
        768: { slidesPerView: 4 },
        1024: { slidesPerView: 5 },
        1280: { slidesPerView: 6 },
      },
    });
  } catch {
    wrapper.innerHTML = `
      <div class="swiper-slide">
        <p class="py-8 text-center text-sm text-muted">Unable to load categories.</p>
      </div>
    `;
  }
}
