import { PrismaClient } from "@prisma/client";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import "../types/fastify.d";

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
    fastify.log.warn({ err }, "Connection error details");
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
