// A single PrismaClient instance shared across the app.
// Creating many clients would open too many database connections, so we make
// exactly one and export it. Repositories are the only code that imports this.
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
