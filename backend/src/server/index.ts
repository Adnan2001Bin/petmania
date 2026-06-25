import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import prismaPlugin from "./prisma";
import authPlugin from "./plugins/auth";
import validationPlugin from "./plugins/validation";
import apiRoutes from "./routes";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);
  await fastify.register(validationPlugin);
  await fastify.register(apiRoutes);

  fastify.get("/", async () => {
    return {
      name: "Petmania API",
      version: "1.0.0",
      status: "running",
    };
  });

  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
