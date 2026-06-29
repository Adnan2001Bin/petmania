import { apiGet } from "./fetch-api";
import type { Banner, BlogPost, Brand, GalleryImage, Testimonial } from "../types";

interface ApiBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  discount?: string | null;
  image: string;
  link: string;
  type: "HERO" | "PROMO";
  size?: "SMALL" | "MEDIUM" | "LARGE" | null;
  align?: "LEFT" | "RIGHT" | "CENTER" | null;
  isActive: boolean;
  sortOrder: number;
}

interface ApiBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  category: string;
  tags?: string | null;
}

interface ApiBrand {
  id: string;
  name: string;
  logo?: string | null;
}

interface ApiGalleryImage {
  id: string;
  src: string;
  alt: string;
  link?: string | null;
}

interface ApiTestimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

function toStorefrontBanner(api: ApiBanner): Banner {
  return {
    id: api.id,
    title: api.title,
    subtitle: api.subtitle ?? undefined,
    description: api.description ?? undefined,
    discount: api.discount ?? undefined,
    image: api.image,
    link: api.link,
    align: api.align?.toLowerCase() as Banner["align"],
    size: api.size?.toLowerCase() as Banner["size"],
  };
}

function toStorefrontBlogPost(api: ApiBlogPost): BlogPost {
  let tags: string[] = [];
  if (api.tags) {
    try {
      tags = JSON.parse(api.tags) as string[];
    } catch {
      tags = [];
    }
  }

  return {
    id: api.id,
    slug: api.slug,
    title: api.title,
    excerpt: api.excerpt,
    image: api.image,
    date: api.date,
    author: api.author,
    category: api.category,
    tags,
  };
}

function toStorefrontBrand(api: ApiBrand): Brand {
  return {
    id: api.id,
    name: api.name,
    logo: api.logo ?? "",
  };
}

function toStorefrontGalleryImage(api: ApiGalleryImage): GalleryImage {
  return {
    id: api.id,
    src: api.src,
    alt: api.alt,
    link: api.link ?? undefined,
  };
}

function toStorefrontTestimonial(api: ApiTestimonial): Testimonial {
  return {
    id: api.id,
    name: api.name,
    role: api.role,
    avatar: api.avatar,
    content: api.content,
    rating: api.rating,
  };
}

export async function fetchBanners(): Promise<Banner[]> {
  const banners = await apiGet<ApiBanner[]>("/banners?limit=50");
  return banners.filter((banner) => banner.isActive).map(toStorefrontBanner);
}

export async function fetchHeroBanners(): Promise<Banner[]> {
  const banners = await apiGet<ApiBanner[]>("/banners/type/HERO");
  return banners.map(toStorefrontBanner);
}

export async function fetchPromoBanners(): Promise<Banner[]> {
  const banners = await apiGet<ApiBanner[]>("/banners/type/PROMO");
  return banners.map(toStorefrontBanner);
}

export function getSmallPromoBanners(banners: Banner[]): Banner[] {
  return banners.filter((banner) => banner.size === "small");
}

export function getMediumPromoBanners(banners: Banner[]): Banner[] {
  return banners.filter((banner) => banner.size === "medium");
}

export async function fetchBlogPosts(limit = 10): Promise<BlogPost[]> {
  const posts = await apiGet<ApiBlogPost[]>(`/blog-posts?limit=${limit}`);
  return posts.map(toStorefrontBlogPost);
}

export async function fetchBrands(limit = 20): Promise<Brand[]> {
  const brands = await apiGet<ApiBrand[]>(`/brands?limit=${limit}`);
  return brands.map(toStorefrontBrand);
}

export async function fetchGalleryImages(limit = 10): Promise<GalleryImage[]> {
  const images = await apiGet<ApiGalleryImage[]>(`/gallery-images?limit=${limit}`);
  return images.map(toStorefrontGalleryImage);
}

export async function fetchTestimonials(limit = 10): Promise<Testimonial[]> {
  const testimonials = await apiGet<ApiTestimonial[]>(
    `/testimonials?limit=${limit}`,
  );
  return testimonials.map(toStorefrontTestimonial);
}
