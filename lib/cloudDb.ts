import { db } from "@/lib/db";

/**
 * Cloud Project dùng chung Prisma Client với:
 * - User
 * - Session
 * - CloudProject
 *
 * Tất cả đều nằm trong cùng Neon PostgreSQL.
 */
export const cloudDb = db;

/**
 * Kiểm tra database PostgreSQL đã được cấu hình hay chưa.
 */
export function cloudDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}