import { z } from "zod";

// ─── Common Schemas ──────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export const intIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

// ─── Animal Schemas ──────────────────────────────────────────────────────────

export const createAnimalSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().max(500).optional(),
  image: z.string().optional(),
});

export const updateAnimalSchema = createAnimalSchema.partial();

// ─── Category Schemas ────────────────────────────────────────────────────────

export const categoryQuerySchema = paginationSchema.extend({
  animalId: z.coerce.number().int().positive().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().max(500).optional(),
  image: z.string().optional(),
  animalId: z.number().int().positive(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ─── Brand Schemas ───────────────────────────────────────────────────────────

export const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  logo: z.string().url().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

// ─── Product Schemas ─────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().min(1),
  price: z.number().positive(),
  oldPrice: z.number().positive().optional(),
  sku: z.string().min(1).max(50),
  image: z.string().min(1),
  inStock: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  categoryId: z.number().int().positive(),
  brandId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z.coerce.boolean().optional(),
  all: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["price", "rating", "createdAt", "name"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Banner Schemas ──────────────────────────────────────────────────────────

export const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  discount: z.string().max(50).optional(),
  image: z.string().url(),
  link: z.string().url(),
  type: z.enum(["HERO", "PROMO"]).default("PROMO"),
  size: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
  align: z.enum(["LEFT", "RIGHT", "CENTER"]).default("LEFT"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateBannerSchema = createBannerSchema.partial();

// ─── BlogPost Schemas ────────────────────────────────────────────────────────

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  excerpt: z.string().min(1).max(500),
  content: z.string().optional(),
  image: z.string().url(),
  date: z.coerce.date().optional(),
  author: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(true),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

// ─── Testimonial Schemas ─────────────────────────────────────────────────────

export const createTestimonialSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  avatar: z.string().url().optional(),
  content: z.string().min(1).max(1000),
  rating: z.number().int().min(1).max(5).default(5),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();

// ─── GalleryImage Schemas ────────────────────────────────────────────────────

export const createGalleryImageSchema = z.object({
  src: z.string().url(),
  alt: z.string().min(1).max(200),
  link: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateGalleryImageSchema = createGalleryImageSchema.partial();

// ─── User Schemas ────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Order Schemas ───────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(1).optional(),
  phone: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z
    .enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .optional(),
  userId: z.string().cuid().optional(),
  sortBy: z.enum(["createdAt", "total", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Review Schemas ──────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  productId: z.string().cuid(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>;
export type UpdateAnimalInput = z.infer<typeof updateAnimalSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
export type CreateGalleryImageInput = z.infer<typeof createGalleryImageSchema>;
export type UpdateGalleryImageInput = z.infer<typeof updateGalleryImageSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
