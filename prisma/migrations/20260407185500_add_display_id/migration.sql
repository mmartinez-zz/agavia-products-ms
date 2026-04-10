-- AlterTable
ALTER TABLE "products" ADD COLUMN "displayId" INTEGER;

-- Populate displayId with incremental values per businessId
WITH ranked AS (
  SELECT 
    id,
    "businessId",
    ROW_NUMBER() OVER (PARTITION BY "businessId" ORDER BY "createdAt") as rn
  FROM products
)
UPDATE products p
SET "displayId" = r.rn
FROM ranked r
WHERE p.id = r.id;

-- Make displayId NOT NULL after populating
ALTER TABLE "products" ALTER COLUMN "displayId" SET NOT NULL;
