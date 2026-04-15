import prisma from '../../infrastructure/database/prismaClient.js';

export async function cleanupDatabase() {
  await prisma.user.deleteMany();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}