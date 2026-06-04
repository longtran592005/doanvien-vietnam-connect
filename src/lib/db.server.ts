import { PrismaClient } from '@prisma/client'

// Ngăn việc tạo nhiều instance Prisma trong môi trường dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function logAudit(action: string, actor: string, target?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        at: new Date().toISOString(),
        actor,
        action,
        target: target || "",
      }
    });
  } catch (err) {
    console.error("Failed to log audit", err);
  }
}
