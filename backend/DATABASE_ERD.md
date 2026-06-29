# Petmania Database ERD

Entity-relationship diagram for the PostgreSQL schema defined in [`prisma/schema.prisma`](./prisma/schema.prisma).

## Diagram

![Petmania Database ERD](./database-erd.png)

<details>
<summary>Mermaid source</summary>

```mermaid
erDiagram
    Animal ||--o{ Category : "has"
    Category ||--o{ Product : "contains"
    Brand ||--o{ Product : "brands"
    Product ||--o{ ProductTag : "tagged via"
    Tag ||--o{ ProductTag : "tagged via"
    User ||--o{ Order : "places"
    Order ||--o{ OrderItem : "contains"
    Product ||--o{ OrderItem : "ordered in"
    User ||--o{ Review : "writes"
    Product ||--o{ Review : "receives"

    Animal {
        int id PK
        string name
        string slug UK
        string description
        string image
        datetime createdAt
        datetime updatedAt
    }

    Category {
        int id PK
        int animalId FK
        string name
        string slug UK
        string description
        string image
        datetime createdAt
        datetime updatedAt
    }

    Brand {
        string id PK
        string name UK
        string logo
        datetime createdAt
        datetime updatedAt
    }

    Tag {
        string id PK
        string name UK
    }

    Product {
        string id PK
        int categoryId FK
        string brandId FK
        string slug UK
        string name
        text description
        decimal price
        decimal oldPrice
        string priceRange
        string sku UK
        string image
        string hoverImage
        enum badge
        decimal rating
        int reviewCount
        boolean inStock
        boolean isActive
        int sortOrder
        datetime createdAt
        datetime updatedAt
    }

    ProductTag {
        string productId PK_FK
        string tagId PK_FK
    }

    User {
        string id PK
        string email UK
        string password
        string name
        enum role
        string avatar
        string phone
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Order {
        string id PK
        string userId FK
        string orderNumber UK
        enum status
        decimal total
        text shippingAddress
        string phone
        text notes
        datetime createdAt
        datetime updatedAt
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        int quantity
        decimal price
    }

    Review {
        string id PK
        string userId FK
        string productId FK
        int rating
        text comment
        datetime createdAt
        datetime updatedAt
    }

    Banner {
        string id PK
        string title
        string subtitle
        string description
        string discount
        string image
        string link
        enum type
        enum size
        enum align
        boolean isActive
        int sortOrder
        datetime createdAt
        datetime updatedAt
    }

    BlogPost {
        string id PK
        string slug UK
        string title
        text excerpt
        text content
        string image
        datetime date
        string author
        string category
        string tags
        boolean isPublished
        datetime createdAt
        datetime updatedAt
    }

    Testimonial {
        string id PK
        string name
        string role
        string avatar
        text content
        int rating
        boolean isActive
        int sortOrder
    }

    GalleryImage {
        string id PK
        string src
        string alt
        string link
        boolean isActive
        int sortOrder
    }
```

</details>

### Regenerate image

Source: [`database-erd.mmd`](./database-erd.mmd)

```bash
npx @mermaid-js/mermaid-cli -i database-erd.mmd -o database-erd.png -b white -s 2
```

## Relationship Summary

| From | To | Cardinality | Notes |
|------|----|-------------|-------|
| **Animal** | **Category** | 1 → many | `animalId` FK, cascade delete |
| **Category** | **Product** | 1 → many | `categoryId` FK (required) |
| **Brand** | **Product** | 1 → many | `brandId` FK (optional) |
| **Product** ↔ **Tag** | via **ProductTag** | many ↔ many | composite PK `(productId, tagId)` |
| **User** | **Order** | 1 → many | |
| **Order** | **OrderItem** | 1 → many | cascade delete on order |
| **Product** | **OrderItem** | 1 → many | |
| **User** | **Review** | 1 → many | unique `(userId, productId)` |
| **Product** | **Review** | 1 → many | cascade delete on product |

## Standalone Tables

These tables have no foreign-key relations to other entities:

| Table | Purpose |
|-------|---------|
| **Banner** | Hero sliders and promo banners |
| **BlogPost** | Blog articles (`category` and `tags` are plain strings, not FKs) |
| **Testimonial** | Customer testimonials |
| **GalleryImage** | Gallery / Instagram-style images |

## Enums

| Enum | Values |
|------|--------|
| `ProductBadge` | `SALE`, `NEW`, `HOT`, `SOLD_OUT` |
| `BannerType` | `HERO`, `PROMO` |
| `BannerSize` | `SMALL`, `MEDIUM`, `LARGE` |
| `BannerAlign` | `LEFT`, `RIGHT`, `CENTER` |
| `OrderStatus` | `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `UserRole` | `ADMIN`, `USER` |

## Taxonomy Hierarchy

```
Animal (Cat, Dog, Bird, Fish)
  └── Category (Cat Food, Dog Toys, …)
        └── Product
              ├── Brand (optional)
              ├── Tags (many-to-many)
              ├── Reviews
              └── OrderItems
```

## Table Name Mapping

Prisma models map to PostgreSQL tables via `@@map`:

| Model | Table |
|-------|-------|
| `Animal` | `animals` |
| `Category` | `categories` |
| `Brand` | `brands` |
| `Tag` | `tags` |
| `Product` | `products` |
| `ProductTag` | `product_tags` |
| `Banner` | `banners` |
| `BlogPost` | `blog_posts` |
| `Testimonial` | `testimonials` |
| `GalleryImage` | `gallery_images` |
| `User` | `users` |
| `Order` | `orders` |
| `OrderItem` | `order_items` |
| `Review` | `reviews` |
