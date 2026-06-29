# Category Migration Guide

This migration adds the `animals` table and converts `categories` from **String (CUID) IDs** to **Integer IDs** with an `animalId` foreign key, while **preserving all existing products**.

## What it does

1. Creates `animals` and seeds Cat, Dog, Bird, Fish
2. Creates new animal-scoped categories (`cat-food`, `dog-toys`, etc.)
3. Backfills `products.categoryId` using:
   - **Product slug** mapping (e.g. `organic-cat-food` → `cat-food`)
   - **Legacy category slug** fallback (e.g. old `treats` → `dog-food`)
4. Drops the old `categories` table and swaps in the new structure

## Run the migration

### Fresh database (no existing tables)

```powershell
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Existing database (already has data, no migration history)

If you previously used `db push` and see the P3005 baseline error:

```powershell
cd backend
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20250628120000_add_animals_and_migrate_categories/migration.sql
npx prisma migrate resolve --applied 20250628120000_add_animals_and_migrate_categories
npx prisma generate
```

### Local development

```powershell
npx prisma migrate dev
```

## Product → category mapping

| Product slug | New category |
|---|---|
| `organic-cat-food` | cat-food |
| `kitten-starter-pack` | cat-food |
| `pet-grooming-kit` | cat-grooming |
| `premium-dog-treats` | dog-food |
| `dry-dog-food-premium` | dog-food |
| `interactive-dog-toy` | dog-toys |
| `cozy-pet-bed` | dog-accessories |
| `leather-pet-collar` | dog-accessories |
| `stainless-steel-bowl` | dog-accessories |
| `parrot-seed-mix` | bird-food |
| `hamster-food-mix` | bird-food |
| `aquarium-fish-food` | fish-food |

**Fallback** (any product not matched by slug):

| Legacy category slug | New category |
|---|---|
| `treats` | dog-food |
| `toys` | dog-toys |
| `beds`, `bowls`, `furniture`, `crates` | dog-accessories |

## After migrating

Optional — seed remaining demo data (brands, banners, etc.):

```powershell
npm run db:seed
```

The seed uses `upsert`, so existing migrated categories and products are updated safely.

## Troubleshooting

**"one or more products have an unmapped categoryId"**

A product exists that isn't covered by the slug or fallback maps. Add a `WHEN` clause for its slug in `migration.sql`, or extend the legacy category fallback, then re-run.

**Already applied partially**

If the migration failed midway, restore from backup or run `npm run db:reset` on a dev database only.
