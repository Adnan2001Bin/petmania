import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import "../../types/fastify.d";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    authenticateAdmin: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "change-this-secret",
    sign: { expiresIn: "7d" },
  });

  // Verify JWT token
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          success: false,
          error: "Unauthorized. Please log in.",
        });
      }
    }
  );

  // Verify JWT token + check ADMIN role
  fastify.decorate(
    "authenticateAdmin",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user as { role: string } | undefined;
        if (!user || user.role !== "ADMIN") {
          return reply.status(403).send({
            success: false,
            error: "Forbidden. Admin access required.",
          });
        }
      } catch {
        return reply.status(401).send({
          success: false,
          error: "Unauthorized. Please log in.",
        });
      }
    }
  );
}

export default fp(authPlugin, {
  name: "auth",
});
