import { PrismaClient } from "@prisma/client";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    dbConnected: boolean;
  }
}

async function prismaPlugin(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  let connected = false;

  try {
    await prisma.$connect();
    connected = true;
    fastify.log.info("Database connected successfully");
  } catch (err) {
    fastify.log.warn(
      "Database connection failed. Server will start without DB."
    );
    fastify.log.warn(
      "Start PostgreSQL and restart the server to enable database features."
    );
  }

  fastify.decorate("prisma", prisma);
  fastify.decorate("dbConnected", connected);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}

export default fp(prismaPlugin, {
  name: "prisma",
});
