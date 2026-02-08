import { defineConfig } from "prisma/config";

export default defineConfig({
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    provider: "sqlite",
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});

