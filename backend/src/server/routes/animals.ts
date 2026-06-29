import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";
import {
  createAnimalSchema,
  updateAnimalSchema,
  intIdParamSchema,
  slugParamSchema,
} from "../../schemas/index";

export default async function animalRoutes(fastify: FastifyInstance) {
  // GET all animals
  fastify.get("/animals", async (_request, reply) => {
    const animals = await fastify.prisma.animal.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { categories: true } } },
    });

    return reply.send({ success: true, data: animals });
  });

  // GET animal by ID
  fastify.get("/animals/:id", async (request, reply) => {
    const { id } = intIdParamSchema.parse(request.params);

    const animal = await fastify.prisma.animal.findUnique({
      where: { id },
      include: {
        categories: { orderBy: { name: "asc" } },
        _count: { select: { categories: true } },
      },
    });

    if (!animal) {
      return reply.status(404).send({
        success: false,
        error: "Animal not found",
      });
    }

    return reply.send({ success: true, data: animal });
  });

  // GET animal by slug
  fastify.get("/animals/slug/:slug", async (request, reply) => {
    const { slug } = slugParamSchema.parse(request.params);

    const animal = await fastify.prisma.animal.findUnique({
      where: { slug },
      include: {
        categories: { orderBy: { name: "asc" } },
        _count: { select: { categories: true } },
      },
    });

    if (!animal) {
      return reply.status(404).send({
        success: false,
        error: "Animal not found",
      });
    }

    return reply.send({ success: true, data: animal });
  });

  // POST create animal
  fastify.post(
    "/animals",
    { preHandler: [fastify.authenticateAdmin] },
    async (request, reply) => {
      const data = createAnimalSchema.parse(request.body);

      const existing = await fastify.prisma.animal.findUnique({
        where: { slug: data.slug },
      });

      if (existing) {
        return reply.status(409).send({
          success: false,
          error: "Animal with this slug already exists",
        });
      }

      const animal = await fastify.prisma.animal.create({ data });

      return reply.status(201).send({ success: true, data: animal });
    },
  );

  // PUT update animal
  fastify.put(
    "/animals/:id",
    { preHandler: [fastify.authenticateAdmin] },
    async (request, reply) => {
      const { id } = intIdParamSchema.parse(request.params);
      const data = updateAnimalSchema.parse(request.body);

      const existing = await fastify.prisma.animal.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: "Animal not found",
        });
      }

      if (data.slug && data.slug !== existing.slug) {
        const slugExists = await fastify.prisma.animal.findUnique({
          where: { slug: data.slug },
        });
        if (slugExists) {
          return reply.status(409).send({
            success: false,
            error: "Animal with this slug already exists",
          });
        }
      }

      const animal = await fastify.prisma.animal.update({
        where: { id },
        data,
      });

      return reply.send({ success: true, data: animal });
    },
  );

  // DELETE animal
  fastify.delete(
    "/animals/:id",
    { preHandler: [fastify.authenticateAdmin] },
    async (request, reply) => {
      const { id } = intIdParamSchema.parse(request.params);

      const existing = await fastify.prisma.animal.findUnique({
        where: { id },
        include: { _count: { select: { categories: true } } },
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: "Animal not found",
        });
      }

      if (existing._count.categories > 0) {
        return reply.status(400).send({
          success: false,
          error: "Cannot delete animal with existing categories",
        });
      }

      await fastify.prisma.animal.delete({ where: { id } });

      return reply.send({
        success: true,
        message: "Animal deleted successfully",
      });
    },
  );
}
