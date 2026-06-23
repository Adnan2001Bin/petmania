import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";
import {
  createBrandSchema,
  updateBrandSchema,
  paginationSchema,
  idParamSchema,
} from "../../schemas/index";

export default async function brandRoutes(fastify: FastifyInstance) {
  // GET all brands
  fastify.get("/brands", async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const [brands, total] = await Promise.all([
      fastify.prisma.brand.findMany({
        skip,
        take: query.limit,
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      }),
      fastify.prisma.brand.count(),
    ]);

    return reply.send({
      success: true,
      data: brands,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  });

  // GET brand by ID
  fastify.get("/brands/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const brand = await fastify.prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!brand) {
      return reply.status(404).send({
        success: false,
        error: "Brand not found",
      });
    }

    return reply.send({ success: true, data: brand });
  });

  // POST create brand
  fastify.post("/brands", async (request, reply) => {
    const data = createBrandSchema.parse(request.body);

    const existing = await fastify.prisma.brand.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: "Brand with this name already exists",
      });
    }

    const brand = await fastify.prisma.brand.create({ data });

    return reply.status(201).send({ success: true, data: brand });
  });

  // PUT update brand
  fastify.put("/brands/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateBrandSchema.parse(request.body);

    const existing = await fastify.prisma.brand.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Brand not found",
      });
    }

    if (data.name && data.name !== existing.name) {
      const nameExists = await fastify.prisma.brand.findUnique({
        where: { name: data.name },
      });
      if (nameExists) {
        return reply.status(409).send({
          success: false,
          error: "Brand with this name already exists",
        });
      }
    }

    const brand = await fastify.prisma.brand.update({
      where: { id },
      data,
    });

    return reply.send({ success: true, data: brand });
  });

  // DELETE brand
  fastify.delete("/brands/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const existing = await fastify.prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Brand not found",
      });
    }

    if (existing._count.products > 0) {
      return reply.status(400).send({
        success: false,
        error: "Cannot delete brand with existing products",
      });
    }

    await fastify.prisma.brand.delete({ where: { id } });

    return reply.send({
      success: true,
      message: "Brand deleted successfully",
    });
  });
}
