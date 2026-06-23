import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (_, reply) => {
    try {
      await fastify.prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch {
      return reply.status(503).send({
        success: false,
        message: "Server is unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      });
    }
  });
}
