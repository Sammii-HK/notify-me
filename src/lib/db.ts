// import { PrismaClient } from '@prisma/client';

// declare global {
//   var __prisma: PrismaClient | undefined;
// }

// // Prevent multiple instances of Prisma Client in development
// const db = globalThis.__prisma || new PrismaClient();

// if (process.env.NODE_ENV === 'development') {
//   globalThis.__prisma = db;
// }

// export default db;


import { PrismaClient } from '@prisma/client';

// Simple Prisma client - Turso is SQLite-compatible
export const prisma = new PrismaClient();

// Default export for backward compatibility
export default prisma;
