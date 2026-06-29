import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  intIdParamSchema,
  slugParamSchema,
} from "../../schemas/index";

export default async function categoryRoutes(fastify: FastifyInstance) {
  // GET all categories
  fastify.get("/categories", async (request, reply) => {
    const query = categoryQuerySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const where = query.animalId ? { animalId: query.animalId } : {};

    const [categories, total] = await Promise.all([
      fastify.prisma.category.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { name: "asc" },
        include: {
          animal: { select: { id: true, name: true, slug: true } },
          _count: { select: { products: true } },
        },
      }),
      fastify.prisma.category.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: categories,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  });

  // GET category by ID
  fastify.get("/categories/:id", async (request, reply) => {
    const { id } = intIdParamSchema.parse(request.params);

    const category = await fastify.prisma.category.findUnique({
      where: { id },
      include: {
        animal: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return reply.status(404).send({
        success: false,
        error: "Category not found",
      });
    }

    return reply.send({ success: true, data: category });
  });

  // GET category by slug
  fastify.get("/categories/slug/:slug", async (request, reply) => {
    const { slug } = slugParamSchema.parse(request.params);

    const category = await fastify.prisma.category.findUnique({
      where: { slug },
      include: {
        animal: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return reply.status(404).send({
        success: false,
        error: "Category not found",
      });
    }

    return reply.send({ success: true, data: category });
  });

  // POST create category
  fastify.post(
    "/categories",
    { preHandler: [fastify.authenticateAdmin] },
    async (request, reply) => {
      const data = createCategorySchema.parse(request.body);

      const animal = await fastify.prisma.animal.findUnique({
        where: { id: data.animalId },
      });

      if (!animal) {
        return reply.status(400).send({
          success: false,
          error: "Animal not found",
        });
      }

      const existing = await fastify.prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (existing) {
        return reply.status(409).send({
          success: false,
          error: "Category with this slug already exists",
        });
      }

      const category = await fastify.prisma.category.create({
        data,
        include: {
          animal: { select: { id: true, name: true, slug: true } },
          _count: { select: { products: true } },
        },
      });

      return reply.status(201).send({ success: true, data: category });
    },
  );

  // PUT update category
  fastify.put(
    "/categories/:id",
    { preHandler: [fastify.authenticateAdmin] },
    async (request, reply) => {
      const { id } = intIdParamSchema.parse(request.params);
      const data = updateCategorySchema.parse(request.body);

      const existing = await fastify.prisma.category.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: "Category not found",
        });
      }

      if (data.animalId) {
        const animal = await fastify.prisma.animal.findUnique({
          where: { id: data.animalId },
        });
        if (!animal) {
          return reply.status(400).send({
            success: false,
            error: "Animal not found",
          });
        }
      }

      if (data.slug && data.slug !== existing.slug) {
        const slugExists = await fastify.prisma.category.findUnique({
          where: { slug: data.slug },
        });
        if (slugExists) {
          return reply.status(409).send({
            success: false,
            error: "Category with this slug already exists",
          });
        }
      }

      const category = await fastify.prisma.category.update({
        where: { id },
        data,
        include: {
          animal: { select: { id: true, name: true, slug: true } },
          _count: { select: { products: true } },
        },
      });

      return reply.send({ success: true, data: category });
    },
  );

  // DELETE category
  fastify.delete(
    "/categories/:id",
    { preHandler: [fastify.authenticateAdmin] },
    async (request, reply) => {
      const { id } = intIdParamSchema.parse(request.params);

      const existing = await fastify.prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: "Category not found",
        });
      }

      if (existing._count.products > 0) {
        return reply.status(400).send({
          success: false,
          error: "Cannot delete category with existing products",
        });
      }

      await fastify.prisma.category.delete({ where: { id } });

      return reply.send({
        success: true,
        message: "Category deleted successfully",
      });
    },
  );
}
