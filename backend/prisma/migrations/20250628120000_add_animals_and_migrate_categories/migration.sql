-- Migration: Add animals table and migrate categories from String (CUID) IDs to Int IDs
-- Backfills existing product relationships without data loss.

-- ─── 1. Create animals table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "animals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "animals_slug_key" ON "animals"("slug");

INSERT INTO "animals" ("name", "slug", "description", "image")
VALUES
    ('Cat', 'cat', 'Everything for your feline friends', '/images/categories/category-1.jpg'),
    ('Dog', 'dog', 'Products for dogs of all sizes', '/images/categories/category-2.jpg'),
    ('Bird', 'bird', 'Food and accessories for birds', '/images/categories/category-3.jpg'),
    ('Fish', 'fish', 'Aquarium essentials and fish food', '/images/categories/category-4.jpg')
ON CONFLICT ("slug") DO NOTHING;

-- ─── 2. Create new categories table (int IDs + animal FK) ───────────────────────

CREATE TABLE "categories_new" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "animalId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_new_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_new_slug_key" ON "categories_new"("slug");
CREATE INDEX "categories_new_animalId_idx" ON "categories_new"("animalId");

ALTER TABLE "categories_new"
    ADD CONSTRAINT "categories_new_animalId_fkey"
    FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed animal-scoped categories (replaces legacy furniture/toys/beds/etc. taxonomy)
INSERT INTO "categories_new" ("name", "slug", "description", "image", "animalId")
VALUES
    (
        'Cat Food',
        'cat-food',
        'Nutritious meals for cats',
        '/images/categories/category-1.jpg',
        (SELECT "id" FROM "animals" WHERE "slug" = 'cat')
    ),
    (
        'Cat Toys',
        'cat-toys',
        'Interactive toys for cats',
        '/images/categories/category-2.jpg',
        (SELECT "id" FROM "animals" WHERE "slug" = 'cat')
    ),
    (
        'Cat Grooming',
        'cat-grooming',
        'Grooming essentials for cats',
        '/images/categories/category-3.jpg',
        (SELECT "id" FROM "animals" WHERE "slug" = 'cat')
    ),
    (
        'Dog Food',
        'dog-food',
        'Premium dog nutrition',
        '/images/categories/category-4.jpg',
        (SELECT "id" FROM "animals" WHERE "slug" = 'dog')
    ),
    (
        'Dog Toys',
        'dog-toys',
        'Fun toys for dogs',
        '/images/categories/category-5.jpg',
        (SELECT "id" FROM "animals" WHERE "slug" = 'dog')
    ),
    (
        'Dog Accessories',
        'dog-accessories',
        'Collars, leashes, and more',
        '/images/categories/category-6.jpg',
        (SELECT "id" FROM "animals" WHERE "slug" = 'dog')
    ),
    (
        'Bird Food',
        'bird-food',
        'Seed mixes and pellets for birds',
        '/images/categories/category-1.jpg',
        (SELECT "id" FROM "animals" WHERE "slug" = 'bird')
    ),
    (
        'Fish Food',
        'fish-food',
        'Flakes and pellets for aquarium fish',
        '/images/categories/category-2.jpg',
        (SELECT "id" FROM "animals" WHERE "slug" = 'fish')
    );

-- ─── 3. Backfill products.categoryId (String → Int) ───────────────────────────

ALTER TABLE "products" ADD COLUMN "categoryId_new" INTEGER;

-- Map products to new categories by product slug (preferred)
UPDATE "products" AS p
SET "categoryId_new" = mapping.target_id
FROM (
    SELECT
        p2."id" AS product_id,
        CASE p2."slug"
            WHEN 'organic-cat-food' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'cat-food')
            WHEN 'kitten-starter-pack' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'cat-food')
            WHEN 'pet-grooming-kit' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'cat-grooming')
            WHEN 'premium-dog-treats' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'dog-food')
            WHEN 'dry-dog-food-premium' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'dog-food')
            WHEN 'interactive-dog-toy' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'dog-toys')
            WHEN 'cozy-pet-bed' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'dog-accessories')
            WHEN 'leather-pet-collar' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'dog-accessories')
            WHEN 'stainless-steel-bowl' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'dog-accessories')
            WHEN 'parrot-seed-mix' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'bird-food')
            WHEN 'hamster-food-mix' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'bird-food')
            WHEN 'aquarium-fish-food' THEN (SELECT "id" FROM "categories_new" WHERE "slug" = 'fish-food')
            ELSE NULL
        END AS target_id
    FROM "products" AS p2
) AS mapping
WHERE p."id" = mapping.product_id
  AND mapping.target_id IS NOT NULL;

-- Fallback: map remaining products via legacy category slug
UPDATE "products" AS p
SET "categoryId_new" = cn."id"
FROM "categories" AS oc
JOIN "categories_new" AS cn ON (
    (oc."slug" = 'treats' AND cn."slug" = 'dog-food')
    OR (oc."slug" = 'toys' AND cn."slug" = 'dog-toys')
    OR (oc."slug" IN ('beds', 'bowls', 'furniture', 'crates') AND cn."slug" = 'dog-accessories')
)
WHERE p."categoryId" = oc."id"
  AND p."categoryId_new" IS NULL;

-- Abort if any product could not be mapped
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "products" WHERE "categoryId_new" IS NULL) THEN
        RAISE EXCEPTION 'Category migration failed: one or more products have an unmapped categoryId';
    END IF;
END $$;

-- ─── 4. Swap product FK from legacy categories to new categories ───────────────

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_categoryId_fkey";

ALTER TABLE "products" DROP COLUMN "categoryId";
ALTER TABLE "products" RENAME COLUMN "categoryId_new" TO "categoryId";
ALTER TABLE "products" ALTER COLUMN "categoryId" SET NOT NULL;

-- ─── 5. Replace legacy categories table ────────────────────────────────────────

DROP TABLE "categories";
ALTER TABLE "categories_new" RENAME TO "categories";

ALTER INDEX "categories_new_pkey" RENAME TO "categories_pkey";
ALTER INDEX "categories_new_slug_key" RENAME TO "categories_slug_key";
ALTER INDEX "categories_new_animalId_idx" RENAME TO "categories_animalId_idx";
ALTER TABLE "categories" RENAME CONSTRAINT "categories_new_animalId_fkey" TO "categories_animalId_fkey";

ALTER TABLE "products"
    ADD CONSTRAINT "products_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
