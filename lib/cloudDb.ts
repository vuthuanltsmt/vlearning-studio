import {
  PrismaClient,
} from "@/generated/cloud-prisma";

const globalForCloudPrisma =
  globalThis as unknown as {
    cloudPrisma:
      | PrismaClient
      | undefined;
  };

export const cloudDb =
  globalForCloudPrisma.cloudPrisma ??
  new PrismaClient();

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForCloudPrisma.cloudPrisma =
    cloudDb;
}

export function cloudDatabaseConfigured() {
  return Boolean(
    process.env.CLOUD_DATABASE_URL?.trim()
  );
}
