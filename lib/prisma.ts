import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Use an absolute path so it works no matter where Next is executed from
const dbFile = path.join(process.cwd(), "prisma", "dev.db");
// If your dev.db is NOT in prisma/dev.db, change the path above accordingly.
const SQLITE_URL = `file:${dbFile}`;

const adapter = new PrismaBetterSqlite3({ url: SQLITE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

