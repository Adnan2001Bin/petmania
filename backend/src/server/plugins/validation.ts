import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { ZodSchema, ZodError } from "zod";
import "../../types/fastify.d";

declare module "fastify" {
  interface FastifyInstance {
    validate: (
      schema: ZodSchema,
      source?: "body" | "query" | "params"
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function validationPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    "validate",
    (
      schema: ZodSchema,
      source: "body" | "query" | "params" = "body"
    ) => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          request[source] = schema.parse(request[source]);
        } catch (error) {
          if (error instanceof ZodError) {
            return reply.status(400).send({
              success: false,
              error: "Validation Error",
              details: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            });
          }
          throw error;
        }
      };
    }
  );
}

export default fp(validationPlugin, {
  name: "validation",
});
