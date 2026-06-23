import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";
import {
  createBannerSchema,
  updateBannerSchema,
  paginationSchema,
  idParamSchema,
} from "../../schemas/index";

export default async function bannerRoutes(fastify: FastifyInstance) {
  // GET all banners
  fastify.get("/banners", async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const [banners, total] = await Promise.all([
      fastify.prisma.banner.findMany({
        skip,
        take: query.limit,
        orderBy: { sortOrder: "asc" },
      }),
      fastify.prisma.banner.count(),
    ]);

    return reply.send({
      success: true,
      data: banners,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  });

  // GET banners by type
  fastify.get("/banners/type/:type", async (request, reply) => {
    const { type } = request.params as { type: string };

    if (!["HERO", "PROMO"].includes(type)) {
      return reply.status(400).send({
        success: false,
        error: "Invalid banner type. Must be HERO or PROMO",
      });
    }

    const banners = await fastify.prisma.banner.findMany({
      where: { type: type as "HERO" | "PROMO", isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return reply.send({ success: true, data: banners });
  });

  // GET banner by ID
  fastify.get("/banners/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const banner = await fastify.prisma.banner.findUnique({ where: { id } });

    if (!banner) {
      return reply.status(404).send({
        success: false,
        error: "Banner not found",
      });
    }

    return reply.send({ success: true, data: banner });
  });

  // POST create banner
  fastify.post("/banners", async (request, reply) => {
    const data = createBannerSchema.parse(request.body);

    const banner = await fastify.prisma.banner.create({ data });

    return reply.status(201).send({ success: true, data: banner });
  });

  // PUT update banner
  fastify.put("/banners/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateBannerSchema.parse(request.body);

    const existing = await fastify.prisma.banner.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Banner not found",
      });
    }

    const banner = await fastify.prisma.banner.update({
      where: { id },
      data,
    });

    return reply.send({ success: true, data: banner });
  });

  // DELETE banner
  fastify.delete("/banners/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const existing = await fastify.prisma.banner.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Banner not found",
      });
    }

    await fastify.prisma.banner.delete({ where: { id } });

    return reply.send({
      success: true,
      message: "Banner deleted successfully",
    });
  });
}
