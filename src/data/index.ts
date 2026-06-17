import type { Product, Category, Banner, Testimonial, BlogPost, Brand, GalleryImage, MenuItem } from '../types';
import productsData from './products.json';
import categoriesData from './categories.json';
import bannersData from './banners.json';
import testimonialsData from './testimonials.json';
import postsData from './posts.json';
import brandsData from './brands.json';
import galleryData from './gallery.json';
import menuData from './menu.json';

export const products: Product[] = productsData;
export const categories: Category[] = categoriesData;
export const banners: Banner[] = bannersData;
export const testimonials: Testimonial[] = testimonialsData;
export const posts: BlogPost[] = postsData;
export const brands: Brand[] = brandsData;
export const gallery: GalleryImage[] = galleryData;
export const menu: MenuItem[] = menuData;

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.category.toLowerCase().replace(/\s+/g, '-') === categorySlug);
}

export function getRelatedProducts(productId: string, limit = 4): Product[] {
  return products.filter((p) => p.id !== productId).slice(0, limit);
}

export function getHeroBanners(): Banner[] {
  return banners.filter((b) => b.id.startsWith('hero-'));
}

export function getPromoBanners(): Banner[] {
  return banners.filter((b) => b.id.startsWith('promo-'));
}

export function getSmallPromoBanners(): Banner[] {
  return banners.filter((b) => b.id.startsWith('promo-') && b.size === 'small');
}

export function getMediumPromoBanners(): Banner[] {
  return banners.filter((b) => b.id.startsWith('promo-') && b.size === 'medium');
}
