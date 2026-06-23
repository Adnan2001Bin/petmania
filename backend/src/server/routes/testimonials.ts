import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  paginationSchema,
  idParamSchema,
} from "../../schemas/index";

export default async function testimonialRoutes(fastify: FastifyInstance) {
  // GET all testimonials
  fastify.get("/testimonials", async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const [testimonials, total] = await Promise.all([
      fastify.prisma.testimonial.findMany({
        skip,
        take: query.limit,
        orderBy: { sortOrder: "asc" },
      }),
      fastify.prisma.testimonial.count(),
    ]);

    return reply.send({
      success: true,
      data: testimonials,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  });

  // GET testimonial by ID
  fastify.get("/testimonials/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const testimonial = await fastify.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      return reply.status(404).send({
        success: false,
        error: "Testimonial not found",
      });
    }

    return reply.send({ success: true, data: testimonial });
  });

  // POST create testimonial
  fastify.post("/testimonials", async (request, reply) => {
    const data = createTestimonialSchema.parse(request.body);

    const testimonial = await fastify.prisma.testimonial.create({ data });

    return reply.status(201).send({ success: true, data: testimonial });
  });

  // PUT update testimonial
  fastify.put("/testimonials/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateTestimonialSchema.parse(request.body);

    const existing = await fastify.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Testimonial not found",
      });
    }

    const testimonial = await fastify.prisma.testimonial.update({
      where: { id },
      data,
    });

    return reply.send({ success: true, data: testimonial });
  });

  // DELETE testimonial
  fastify.delete("/testimonials/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const existing = await fastify.prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Testimonial not found",
      });
    }

    await fastify.prisma.testimonial.delete({ where: { id } });

    return reply.send({
      success: true,
      message: "Testimonial deleted successfully",
    });
  });
}
