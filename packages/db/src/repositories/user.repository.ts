// Data access for users. This is the ONLY place user queries touch Prisma.
// Services call these functions instead of talking to the database directly,
// which keeps the business logic testable and the ORM swappable.
import { prisma } from '../client';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: { email: string; passwordHash: string }) {
    return prisma.user.create({ data });
  },
};
