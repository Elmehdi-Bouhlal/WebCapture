import prisma from '../../config/prisma.js';

class GuestSessionRepository {
  async findOrCreate(ipAddress) {
    const existing = await prisma.guest_sessions.findUnique({
      where: { ip_address: ipAddress },
    });

    if (existing) return existing;

    return await prisma.guest_sessions.create({
      data: { ip_address: ipAddress },
    });
  }

  async block(id) {
    return await prisma.guest_sessions.update({
      where: { id },
      data: { is_blocked: true },
    });
  }

  async incrementTries(id) {
    return await prisma.guest_sessions.update({
      where: { id },
      data: { tries_used: { increment: 1 } },
    });
  }
}

export default new GuestSessionRepository();
