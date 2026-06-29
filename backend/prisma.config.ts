import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Keep generate/build working in CI or Docker build stages
    // where DATABASE_URL is not injected yet.
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/petmania_db?schema=public",
  },
});
