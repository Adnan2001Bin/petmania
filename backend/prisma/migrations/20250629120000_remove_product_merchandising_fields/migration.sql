-- Remove unused product merchandising fields
ALTER TABLE "products" DROP COLUMN IF EXISTS "hoverImage";
ALTER TABLE "products" DROP COLUMN IF EXISTS "badge";
ALTER TABLE "products" DROP COLUMN IF EXISTS "priceRange";

DROP TYPE IF EXISTS "ProductBadge";
