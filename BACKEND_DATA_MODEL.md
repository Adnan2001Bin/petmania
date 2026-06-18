# Petmania Backend Data Model

## Overview

This document describes the database schema and validation schemas for the Petmania backend built with **Prisma**, **Zod**, and **Fastify**.

## Database Models

### Core Entities

| Model | Description | Key Fields |
|-------|-------------|------------|
| `Category` | Product categories (e.g., Dog Food, Cat Food) | `id`, `slug`, `name`, `image` |
| `Brand` | Product brands (e.g., PetPro, HappyPaws) | `id`, `name`, `logo` |
| `Product` | Main product entity | `id`, `slug`, `name`, `price`, `sku`, `badge`, `rating` |
| `Tag` | Tags for product filtering | `id`, `name` |

### Content Entities

| Model | Description | Key Fields |
|-------|-------------|------------|
| `Banner` | Hero sliders & promo banners | `id`, `title`, `type`, `size`, `image` |
| `BlogPost` | Blog articles | `id`, `slug`, `title`, `content`, `category` |
| `Testimonial` | Customer testimonials | `id`, `name`, `role`, `content`, `rating` |
| `GalleryImage` | Instagram gallery images | `id`, `src`, `alt`, `link` |

### User & Order Entities

| Model | Description | Key Fields |
|-------|-------------|------------|
| `User` | System users (admin/customers) | `id`, `email`, `password`, `role` |
| `Order` | Customer orders | `id`, `orderNumber`, `status`, `total` |
| `OrderItem` | Items in an order | `id`, `quantity`, `price` |
| `Review` | Product reviews | `id`, `rating`, `comment` |

## Relationships

```
Category ──< Product >── Brand
                │
                ├──< ProductTag >── Tag
                │
                ├──< Review >── User
                │
                └──< OrderItem >── Order ──> User
```

## Enums

| Enum | Values |
|------|--------|
| `ProductBadge` | `SALE`, `NEW`, `HOT`, `SOLD_OUT` |
| `BannerType` | `HERO`, `PROMO` |
| `BannerSize` | `SMALL`, `MEDIUM`, `LARGE` |
| `BannerAlign` | `LEFT`, `RIGHT`, `CENTER` |
| `OrderStatus` | `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `UserRole` | `ADMIN`, `USER` |

## Validation Schemas

Located in `src/schemas/index.ts`, these Zod schemas validate all API requests:

### Create/Update Schemas
- `createCategorySchema` / `updateCategorySchema`
- `createBrandSchema` / `updateBrandSchema`
- `createProductSchema` / `updateProductSchema`
- `createBannerSchema` / `updateBannerSchema`
- `createBlogPostSchema` / `updateBlogPostSchema`
- `createTestimonialSchema` / `updateTestimonialSchema`
- `createGalleryImageSchema` / `updateGalleryImageSchema`
- `createUserSchema` / `updateUserSchema`
- `createOrderSchema` / `updateOrderStatusSchema`
- `createReviewSchema` / `updateReviewSchema`

### Query Schemas
- `paginationSchema` - Pagination parameters
- `productQuerySchema` - Product filtering & sorting
- `orderQuerySchema` - Order filtering & sorting

## Frontend Mapping

| Frontend Interface | Backend Model |
|--------------------|---------------|
| `Product` | `Product` + `Category` + `Brand` + `Tag[]` |
| `Category` | `Category` |
| `Banner` | `Banner` |
| `BlogPost` | `BlogPost` |
| `Testimonial` | `Testimonial` |
| `Brand` | `Brand` |
| `GalleryImage` | `GalleryImage` |
| `CartItem` | Client-side only (localStorage) |
| `MenuItem` | Static config or `Menu` model (not yet added) |

## Setup Instructions

### 1. Install Dependencies

```bash
npm install prisma @prisma/client zod fastify
npm install -D @types/node
```

### 2. Initialize Prisma

```bash
npx prisma init
```

### 3. Configure Database

Edit `.env` file with your PostgreSQL credentials:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/petmania?schema=public"
```

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Seed Database

```bash
npx prisma db seed
```

## Files Created

```
prisma/
  schema.prisma          # Database schema

src/
  schemas/
    index.ts             # Zod validation schemas

.env                     # Environment variables
```
