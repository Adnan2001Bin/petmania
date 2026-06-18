import type { FastifyInstance } from "fastify";
import healthRoutes from "./health";

export default async function apiRoutes(fastify: FastifyInstance) {
  fastify.register(healthRoutes, { prefix: "/api" });
}
