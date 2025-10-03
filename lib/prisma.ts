// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  analyticsPrisma: PrismaClient;
};

// Main database singleton
export const prisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Analytics database singleton
export const analyticsPrisma =
  globalForPrisma.analyticsPrisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.ANALYTICS_DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.analyticsPrisma = analyticsPrisma;