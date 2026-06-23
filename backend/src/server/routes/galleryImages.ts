import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";
import {
  createGalleryImageSchema,
  updateGalleryImageSchema,
  paginationSchema,
  idParamSchema,
} from "../../schemas/index";

export default async function galleryImageRoutes(fastify: FastifyInstance) {
  // GET all gallery images
  fastify.get("/gallery-images", async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const [images, total] = await Promise.all([
      fastify.prisma.galleryImage.findMany({
        skip,
        take: query.limit,
        orderBy: { sortOrder: "asc" },
      }),
      fastify.prisma.galleryImage.count(),
    ]);

    return reply.send({
      success: true,
      data: images,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  });

  // GET gallery image by ID
  fastify.get("/gallery-images/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const image = await fastify.prisma.galleryImage.findUnique({
      where: { id },
    });

    if (!image) {
      return reply.status(404).send({
        success: false,
        error: "Gallery image not found",
      });
    }

    return reply.send({ success: true, data: image });
  });

  // POST create gallery image
  fastify.post("/gallery-images", async (request, reply) => {
    const data = createGalleryImageSchema.parse(request.body);

    const image = await fastify.prisma.galleryImage.create({ data });

    return reply.status(201).send({ success: true, data: image });
  });

  // PUT update gallery image
  fastify.put("/gallery-images/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateGalleryImageSchema.parse(request.body);

    const existing = await fastify.prisma.galleryImage.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Gallery image not found",
      });
    }

    const image = await fastify.prisma.galleryImage.update({
      where: { id },
      data,
    });

    return reply.send({ success: true, data: image });
  });

  // DELETE gallery image
  fastify.delete("/gallery-images/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const existing = await fastify.prisma.galleryImage.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Gallery image not found",
      });
    }

    await fastify.prisma.galleryImage.delete({ where: { id } });

    return reply.send({
      success: true,
      message: "Gallery image deleted successfully",
    });
  });
}
